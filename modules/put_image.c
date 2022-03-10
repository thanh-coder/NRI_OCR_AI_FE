
#include <math.h>
#include <stdlib.h>
#include <stdio.h>
#include <emscripten.h>

 EM_JS(void, handlePrintString, (int ptr,int len), {
    const view = new Uint8Array(memory.buffer, ptr, len);
    let string = '';
    for (let i = 0; i < len; i++) {
      string += String.fromCharCode(view[i]);
    }
    console.log(string);
  });

EMSCRIPTEN_KEEPALIVE
void grayScale (unsigned char* data, int len) {
  for (int i = 0; i < len; i += 4) {
    int r = data[i];
    int g = data[i+1];
    int b = data[i+2];
    int a = data[i+3];
    data[i] = r;
    data[i+1] = r;
    data[i+2] = r;
    data[i+3] = a;
  }
  const char* str = "Hello from C++!";
  handlePrintString(str, strlen(str));
  }