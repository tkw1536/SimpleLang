(function(global){

    /**
    * Represents a SimpleLang Machine.
    *
    * @param {string|SimpleLang.ProgramLine[]} program - Program to run.
    * @param {number} memory_size - Size of memory.
    *
    * @return {SimpleLang} - this for chaining
    * @this {SimpleLang}
    * @alias SimpleLang
    * @class
    */
    var SimpleLang = function(program, memory_size){

        /**
        * The tokenised program this machine runs.
        * @name SimpleLang#program
        * @type {SimpleLang.ProgramLine[]}
        */
        this.program = SimpleLang.parse(program);

        /**
        * The current memory of the machine.
        * @name SimpleLang#memory
        * @type {number[]}
        */
        this.memory = [];

        for(var i=0;i<memory_size;i++){
            this.memory.push(0);
        }

        /**
        * The current value of the machines accumalator.
        * @name SimpleLang#accumalator
        * @type {number}
        */
        this.accumalator = 0;

        /**
        * The current value of the program counter.
        * @name SimpleLang#program_counter
        * @type {number}
        */
        this.program_counter = 0;

        /**
        * Boolean stating if the machine is halted.
        * @name SimpleLang#is_halted
        * @type {boolean}
        */
        this.is_halted = false;
    }

    /**
    * Parses a program.
    * @param {string|SimpleLang.ProgramLine[]} Program to parse.
    * @returns {SimpleLang.ProgramLine[]} - The program to run.
    */
    SimpleLang.parse = function(program_string){
        //we are already a program => return
        if(typeof program_string !== "string"){
            return program_string;
        }

        //split by spaces.
        var program =
        program_string
        .replace(/HALT(?!(\s|\n)+#?\d+)/ig, "HALT #0")
        .replace(/(\s|\n)+/gm, " ").trim().toString().split(" ");

        //intialise the array
        var lineArray = [];

        var instr, op, abs;

        for(var i=0;i<program.length - 1;i+=2){
            instr = program[i].toUpperCase();
            op = program[i+1];

            //we do not know this instruction
            if(!SimpleLang.instructions.hasOwnProperty(instr)){
                throw new Error("Expected valid instruction at token "+i);
            }

            if(op[0] == "#"){
                abs = true;
                op = op.substring(1);
            } else {
                abs = false;
            }

            op = parseInt(op);

            if(isNaN(op)){
                throw new Error("Expected valid number at token "+i);
            }

            lineArray.push([instr, abs, op]);
        }

        if(program.length % 2 !== 0){
            throw new Error("Unexpected end of input, need one more token after position "+i);
        }

        return lineArray;

    }

    /**
    * Explains a single line of a program in human-readable form.
    * @param {SimpleLang.ProgramLine} line - Line to convert
    * @returns {string}
    */
    SimpleLang.explainLine = function(line){
        var code = line[0];
        var is_abs = line[1];
        var op = line[2];

        switch(code){
            case "LOAD":
                if(is_abs){
                    return "Load the value "+op+" into the accumulator";
                } else {
                    return "Load the value of memory location "+op+" into the accumulator";
                }
            case "STORE":
                return "Store the value of the accumulator in memory location "+op;
            case "ADD":
                if(is_abs){
                    return "Add the value "+op+" to the accumulator";
                } else {
                    return "Add the value of memory location "+op+" to the accumulator";
                }
            case "SUB":
                if(is_abs){
                    return "Subtract the value "+op+" from the accumulator";
                } else {
                    return "Subtract the value of memory location "+op+" from the accumulator";
                }
            case "EQUAL":
                if(is_abs){
                    return "Skip next instruction if accumulator equal to "+op;
                } else {
                    return "Skip next instruction if accumulator equal to memory location "+op;
                }
            case "JUMP":
                return "Jump to instruction "+op+" (set program counter to "+op+")";
            case "HALT":
                return "Stop execution";
        }
    }

    /**
    * Returns true if this SimpeLang Machine is halted.
    * @this {SimpleLang}
    * @returns {bool} - if this SimpeLang Machine is halted.
    */
    SimpleLang.prototype.isHalted = function(){
        return this.is_halted;
    }

    /**
    * Returns the current state of the machine.
    * @this {SimpleLang}
    * @returns {SimpleLang.state} - the current state of this machine.
    */
    SimpleLang.prototype.getState = function(){
        return JSON.parse(JSON.stringify({
            "memory": this.memory,
            "acc": this.accumalator,
            "program_counter": this.program_counter
        }));
    }

    /**
    * Sets the current state of the machine.
    * @param {SimpleLang.state} state - State to set the machine to.
    * @this {SimpleLang}
    * @returns {SimpleLang} - this for chaining
    */
    SimpleLang.prototype.setState = function(state){

        var state = JSON.parse(JSON.stringify(state)); //make a copy

        //store back the state
        this.memory = state["memory"];
        this.accumalator = state["acc"];
        this.program_counter = state["program_counter"];

        return this;
    }

    /**
    * Runs the main loop of the computer continuously and echoes text to the command line.
    * @param {number} max - The maximum number of iterations to run.
    * @param {function} on_log - Called to log an action.
    * @param {function} on_error - Called to log an error.
    * @this {SimpleLang}
    * @returns {number} - Number of iterations needed.
    */
    SimpleLang.prototype.run_loop = function(max, on_log, on_error){
        for(i=0;i<max && !this.isHalted(); i++){
            try{
                on_log(i, this.loop(true));
            } catch(e){
                on_error(e);
                break;
            }
        }

        if(!this.isHalted()){
            on_error(new Error("(INSTR_LIMIT_REACHED) Maximum number of instructions exceeded"));
        }

        return i;
    }

    /**
    * Runs one iteration of the main loop of this machine.
    * @param {boolean} [return_state_string = false] If set to true returns a string indicating the executed instruction.
    * @this {SimpleLang}
    * @returns {SimpleLang|string} - this for chaining or a string indicating the executed instruction.
    */
    SimpleLang.prototype.loop = function(return_state_string){
        var return_state_string = (return_state_string)?true:false;
        var state_string = ""; //state to return.

        state_string = "PC="+pad(this.program_counter, 3)+" ACC="+pad(this.accumalator, 5)+" ";

        //are we halted.
        if(this.isHalted()){
            throw new Error("(IS_HALTED) This machine is halted. ");
        }

        //program counter should be an int.
        if(this.program_counter != parseInt(this.program_counter)){
            this.is_halted = true;
            throw new Error("(INV_PROGRAM_COUNTER) Program Counter not an integer. ");
        }

        //not too big.
        if(this.program_counter >= this.program.length || this.program_counter < 0){
            this.is_halted = true;
            throw new Error("(INV_PROGRAM_COUNTER) Program Counter out of range. ");
        }

        //read the instruction
        var line = this.program[this.program_counter];
        line[0] = line[0].toUpperCase(); //turn it into upper case

        //extract components
        var instruction = line[0];
        var is_abs = line[1]?true:false;
        var op = line[2];


        //do we have a valid instruction.
        if(!SimpleLang.instructions.hasOwnProperty(instruction)){
            this.is_halted = true;
            throw new Error("(INV_INSTRUCTION) Unknown instruction. ");
        }

        var op_resolved = op; //we resolve the operand already.
        var op_string = op.toString(); //and the string

        //we only need to work if it's not absolute.
        if(!is_abs){
            //operand is an integer
            if(op != parseInt(op)){
                this.is_halted = true;
                throw new Error("(INV_OPERAND) Pointing operand has to be an integer. ");
            }

            //and withing the memory range.
            if(op < 0 || op >= this.memory.length){
                this.is_halted = true;
                throw new Error("(INV_OPERAND) Operand out of range");
            }

            op_resolved = this.memory[op];
        } else {
            //We are not doing absolute stuff.
            op_string = "#"+op_string;
        }

        switch(instruction){
            case "LOAD":
                this.accumalator = op_resolved;
                state_string += "LOAD";
                break;
            case "STORE":
                //We can not write to dynamic adresses
                if(is_abs){
                    this.is_halted = true;
                    throw new Error("(INV_OPERAND) Address to write to has to be a pointer. ");
                }

                //Write the value.
                this.memory[op] = this.accumalator;
                state_string += "STORE";
                break;
            case "ADD":
                this.accumalator += op_resolved;
                state_string += "ADD";
                break;
            case "SUB":
                this.accumalator -= op_resolved;
                state_string += "SUB";
                break;
            case "EQUAL":
                if(this.accumalator == op_resolved){
                    this.program_counter++; //skip the next instruction
                }
                state_string += "EQUAL";
                break;
            case "JUMP":
                if(!is_abs){
                    this.is_halted = true;
                    throw new Error("(INV_OPERAND) Address to jump to has to be absolute. ");
                }

                this.program_counter = op - 1; //jump to that adress; we will add the one back below.

                state_string += "JUMP";
                break;
            case "HALT":
                state_string += "HALT";
                op_string = "";
                this.is_halted = true;
                break;

        }

        //increase the program counter.
        this.program_counter++;

        state_string += " "+op_string;

        if(return_state_string){
            return state_string;
        } else {
            return this;
        }
    }

    /**
    * Turns the program of this machine into a string.
    * @param {number} bytes - Number of bytes to print for arguments.
    * @param {boolean} [latex = false] - Should we return some nice latex?
    * @this {SimpleLang}
    * @returns {string} - Program String.
    */
    SimpleLang.prototype.toProgramString = function(bytes, latex){

        var instruction;

        //string to return
        var str = "";

        if(latex){

            str += "\\begin{tabular}{| l | l | l | l |}\n";
            str += "\\hline\n";
            str += "\\# & \\textbf{Machine Code} & \\textbf{Assembly Code} & \\textbf{Description} \\\\\\hline\n";

            for(var i=0;i<this.program.length;i++){
                instruction = this.program[i];

                str += ""+(i)+" & "

                str += SimpleLang.instructions[instruction[0]] + "\\ "
                str += ((instruction[1])?"1":"0") + "\\ "
                str += pad(instruction[2].toString(2), bytes)

                str += " & "

                str += pad_s(instruction[0], 6).replace(" ", "\\ ");

                if(instruction[0] !== "HALT"){
                    str+= ((instruction[1])?"\\#":"")+instruction[2] + " & "
                } else {
                    str += " & "
                }

                str += SimpleLang.explainLine(instruction);

                str += "\\\\\n";
            }

            str += "\\hline\\end{tabular}";
        } else {
            //Do it the ugly way
            for(var i=0;i<this.program.length;i++){
                instruction = this.program[i];
                str += SimpleLang.instructions[instruction[0]]
                str += ((instruction[1])?"1":"0")
                str += pad(instruction[2].toString(2), bytes)

                str += "\n";
            }
        }

        return str;
    }

    /**
    * The state of a SimpleLang machine
    * @typedef {Object} SimpleLang.state
    * @property {number[]} memory - Memory of the machine.
    * @property {number} acc - Current value of the accumalator
    * @property {number} program_counter - Current value of the program counter.
    */

    /**
    * A line of a program for the SimpleLang machine.
    * @typedef {Array.<SimpleLang.instructions,bool,number>} SimpleLang.ProgramLine
    * @property {SimpleLang.instructions} 0 - Instruction to execute.
    * @property {bool} 1 - If true, the operand is considered an absoulte value otherwise a reference to a memory adress.
    * @property {number} 2 - operand
    */

    /**
    * All instructions supported by the SimpleLang machine.
    * @enum {string}
    */
    SimpleLang.instructions = {
        /** Loads the operand into the accumalator. */
        "LOAD": "001",
        /** Stores the accumalator value in memory. */
        "STORE": "010",
        /** Adds the operand value to the accumalator. */
        "ADD": "011",
        /** Subtracts the operand value from the accumalator. */
        "SUB": "100",
        /** Jumps the next instruction iff the accumalator value equals the operand. */
        "EQUAL": "101",
        /** Jumps to the instruction specefied by the operand. */
        "JUMP": "110",
        /** Halts this machine. */
        "HALT": "111"
    }

    //simple helper to display leading zeros.
    //source: http://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript
    function pad(num, size) {
        var s = num+"";
        while (s.length < size) s = "0" + s;
        return s;
    }

    //simple helper to make a strsing of fixed length
    function pad_s(s, size) {
        var s = s;
        while (s.length < size) s = s+" ";
        return s;
    }

    global.SimpleLang = SimpleLang;
})((typeof module !== "undefined" && module.exports)?module.exports:window)
