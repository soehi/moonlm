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
 * Read exactly `n` bytes from the start of the file into a MoonBit Bytes
 * allocated here, and return it.
 *
 * Allocating on this side is what keeps peak memory at one copy of the file:
 * allocating a FixedArray[Byte] in MoonBit and copying it into a Bytes would
 * hold both at once, which for a 138 MB model is 138 MB of avoidable peak. The
 * returned object is a normal MoonBit heap object, so the GC owns it from here.
 *
 * Returns a zero-length Bytes if anything goes wrong; the caller already knows
 * the expected size and reports the mismatch.
 */
MOONBIT_FFI_EXPORT
moonbit_bytes_t ml_read_owned(void *handle, int64_t n) {
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

/*
 * Read one line from stdin into a caller-owned buffer, including the trailing
 * newline and without NUL termination. Returns the byte count, or 0 at EOF.
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

/*
 * 1 if `path` exists (as a file or directory), 0 otherwise.
 *
 * Used by the CLI to pick a default model without loading the tools package
 * into argument parsing.
 */
MOONBIT_FFI_EXPORT
int32_t ml_path_exists(const char *path) {
  FILE *f = fopen(path, "rb");
  if (f != NULL) {
    fclose(f);
    return 1;
  }
  return 0;
}
