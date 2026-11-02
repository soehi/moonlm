/*
 * Minimal file reading for the example.
 *
 * An example may not import an executable package, so it cannot reuse
 * `src/cli/file_native.mbt`; this is the same fopen/fread shape, kept small and
 * local. It is argv plumbing for a path the USER typed, not part of the engine:
 * the `engine` package performs no I/O of its own, which is what lets the same
 * code run in a browser where there is no filesystem.
 */

#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <moonbit.h>

MOONBIT_FFI_EXPORT
void *ex_fopen(const char *path, const char *mode) {
  return fopen(path, mode);
}

MOONBIT_FFI_EXPORT
int32_t ex_is_null(void *ptr) {
  return ptr == 0;
}

MOONBIT_FFI_EXPORT
int32_t ex_fclose(void *handle) {
  return fclose((FILE *)handle);
}

MOONBIT_FFI_EXPORT
int64_t ex_size(void *handle) {
  FILE *f = (FILE *)handle;
  if (fseek(f, 0, SEEK_END) != 0) {
    return -1;
  }
  long n = ftell(f);
  if (n < 0) {
    return -1;
  }
  if (fseek(f, 0, SEEK_SET) != 0) {
    return -1;
  }
  return (int64_t)n;
}

MOONBIT_FFI_EXPORT
moonbit_bytes_t ex_read_owned(void *handle, int64_t n) {
  FILE *f = (FILE *)handle;
  if (fseek(f, 0, SEEK_SET) != 0) {
    return moonbit_make_bytes_raw(0);
  }
  moonbit_bytes_t buf = moonbit_make_bytes_raw((int32_t)n);
  size_t got = fread(buf, 1, (size_t)n, f);
  if ((int64_t)got != n) {
    return moonbit_make_bytes_raw(0);
  }
  return buf;
}

MOONBIT_FFI_EXPORT
void ex_exit(int32_t code) {
  exit(code);
}

/*
 * Core only offers `println`, which is line-buffered. Streaming a token at a
 * time needs the bytes to reach the terminal immediately, so this flushes
 * explicitly instead of emitting one newline per token.
 */
MOONBIT_FFI_EXPORT
int32_t ex_puts(const char *s) {
  int32_t r = fputs(s, stdout);
  fflush(stdout);
  return r;
}