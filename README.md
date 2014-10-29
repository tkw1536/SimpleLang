# SimpleLang

A really simple Interpreter written for GenICT.

## Install
```
npm install -g simplelang
```

## Usage

To run a simple program:

```bash
simple_lang 'LOAD #5 STORE 15 LOAD #0 EQUAL 15 JUMP #6 HALT #0 ADD #1 JUMP #3'
```

To run a program stored in a simple text file:

```bash
simple_lang /path/to/text/file
```

To set memory size:
```bash
simple_lang /path/to/text/file -m MEMORY_SIZE
```

To set memory values:
```bash
simple_lang /path/to/text/file -m CELL_0 CELL_1 ... CELL_N
```

## License

(c) Tom Wiesing 2014, licensed under MIT. See License file. 
