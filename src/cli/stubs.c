/*
 * Native stubs that back src/cli/file_native.mbt.
 *
 * Only this file knows about C's stdio; the MoonBit side sees an opaque
 * `MlFile` handle and a byte count. Every entry point returns an error indicator
 * instead of aborting, so a missing or unreadable file becomes a MoonBit `Err`.
 */

#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <moonbit.h>

MOONBIT_FFI_EXPORT
void *ml_fopen(const char *path, const char *mode) {
  return fopen(path, mode);
}

MOONBIT_FFI_EXPORT
int32_t ml_is_null(void *ptr) {
  return ptr == 0;
}

MOONBIT_FFI_EXPORT
int32_t ml_fclose(void *handle) {
  return fclose((FILE *)handle);
}

/*
 * Total file size in bytes, or a negative value if it cannot be determined.
 *
 * `ftell` returns `long`, which is 32 bits on Windows even for 64-bit builds,
 * so the caller rejects files that exceed the 32-bit index range rather than
 * truncating a silent wrapped value here.
 */
MOONBIT_FFI_EXPORT
int64_t ml_size(void *handle) {
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

/*
 * Read up to `n` bytes from the start of the file into a caller-owned buffer,
 * returning the number of bytes actually read.
 */
MOONBIT_FFI_EXPORT
int64_t ml_read(char *buf, void *handle, int64_t n) {
  FILE *f = (FILE *)handle;
  if (fseek(f, 0, SEEK_SET) != 0) {
    return -1;
  }
  return (int64_t)fread(buf, 1, (size_t)n, f);
}

/*
 * Process termination with a status code, so the CLI can report a failed
 * inspection through its exit status.
 */
MOONBIT_FFI_EXPORT
void ml_exit(int32_t code) {
  exit(code);
}

/*
 * Read one line from stdin into a caller-owned buffer, including the trailing
 * newline and without NUL termination. Returns the byte count, or 0 at EOF.
 */
MOONBIT_FFI_EXPORT
int32_t ml_stdin_read(char *buf, int32_t n) {
  if (fgets(buf, n, stdin) == NULL) {
    return 0;
  }
  return (int32_t)strlen(buf);
}

/*
 * Write a NUL-terminated string to stdout and flush, so streamed tokens appear
 * as they are produced rather than at process exit.
 */
MOONBIT_FFI_EXPORT
int32_t ml_puts(const char *s) {
  fputs(s, stdout);
  fflush(stdout);
  return 0;
}
