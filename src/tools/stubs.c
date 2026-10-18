/*
 * Native stubs that back src/tools/*_native.mbt.
 *
 * Only this file knows about C's filesystem. Every entry point reports failure
 * through a value rather than aborting: `ml_realpath` and `ml_list_dir` return
 * a one-byte-status envelope (0 = ok, payload follows; 1 = error, payload is
 * the message), and the numeric queries return a negative value. The message
 * for a failure is kept in `ml_error_text` and read back with `ml_last_error`,
 * so the MoonBit side can attach errno/win32 semantics to a plain `Err`.
 *
 * Paths arrive as UTF-8. On Windows they are converted to UTF-16 and the wide
 * APIs are used, because the ANSI APIs cannot represent non-ASCII names under
 * the default code page.
 */

#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <sys/stat.h>
#include <moonbit.h>

#ifdef _WIN32
#include <windows.h>
#include <wchar.h>
#else
#include <dirent.h>
#include <unistd.h>
#endif

static char ml_error_text[1024];

static void set_errno_error(const char *what) {
  int e = errno;
  snprintf(ml_error_text, sizeof ml_error_text, "%s: errno %d (%s)", what, e,
           strerror(e));
}

#ifdef _WIN32

static void set_win32_error(const char *what) {
  DWORD code = GetLastError();
  wchar_t wbuf[512];
  DWORD n = FormatMessageW(
      FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, code,
      MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), wbuf, 512, NULL);
  while (n > 0 && (wbuf[n - 1] == L'\r' || wbuf[n - 1] == L'\n')) {
    wbuf[--n] = L'\0';
  }
  char ubuf[768];
  ubuf[0] = '\0';
  if (n > 0) {
    WideCharToMultiByte(CP_UTF8, 0, wbuf, -1, ubuf, (int)sizeof ubuf, NULL,
                        NULL);
  }
  snprintf(ml_error_text, sizeof ml_error_text, "%s: win32 error %lu (%s)",
           what, (unsigned long)code, ubuf);
}

static wchar_t *utf8_to_wide(const char *s) {
  int n = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, s, -1, NULL, 0);
  if (n <= 0) {
    return NULL;
  }
  wchar_t *w = (wchar_t *)malloc((size_t)n * sizeof(wchar_t));
  if (w == NULL) {
    SetLastError(ERROR_NOT_ENOUGH_MEMORY);
    return NULL;
  }
  if (MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, s, -1, w, n) <= 0) {
    free(w);
    return NULL;
  }
  return w;
}

static char *wide_to_utf8(const wchar_t *w) {
  int n = WideCharToMultiByte(CP_UTF8, 0, w, -1, NULL, 0, NULL, NULL);
  if (n <= 0) {
    return NULL;
  }
  char *s = (char *)malloc((size_t)n);
  if (s == NULL) {
    return NULL;
  }
  if (WideCharToMultiByte(CP_UTF8, 0, w, -1, s, n, NULL, NULL) <= 0) {
    free(s);
    return NULL;
  }
  return s;
}

/*
 * Turn a `\\?\C:\...` or `\\?\UNC\server\share\...` final path into the plain
 * form callers expect, and normalize separators to backslash.
 */
static void normalize_final_path(wchar_t *w) {
  if (wcsncmp(w, L"\\\\?\\UNC\\", 8) == 0) {
    size_t rest = wcslen(w + 8);
    memmove(w + 2, w + 8, (rest + 1) * sizeof(wchar_t));
    w[0] = L'\\';
    w[1] = L'\\';
  } else if (wcsncmp(w, L"\\\\?\\", 4) == 0) {
    size_t rest = wcslen(w + 4);
    memmove(w, w + 4, (rest + 1) * sizeof(wchar_t));
  }
  for (wchar_t *p = w; *p; ++p) {
    if (*p == L'/') {
      *p = L'\\';
    }
  }
}

#endif /* _WIN32 */

static moonbit_bytes_t make_envelope(int status, const char *payload,
                                     size_t len) {
  if (len > 0x7FFFFFFE) {
    len = 0;
  }
  moonbit_bytes_t b = moonbit_make_bytes_raw((int32_t)(1 + len));
  b[0] = (uint8_t)status;
  if (len > 0 && payload != NULL) {
    memcpy(b + 1, payload, len);
  }
  return b;
}

static moonbit_bytes_t envelope_ok_str(const char *s) {
  return make_envelope(0, s, s ? strlen(s) : 0);
}

static moonbit_bytes_t envelope_error(void) {
  return make_envelope(1, ml_error_text, strlen(ml_error_text));
}

/*|
 * 1 on Windows, 0 elsewhere. The sandbox compares path prefixes
 * case-insensitively only where the filesystem does.
 */
MOONBIT_FFI_EXPORT
int32_t ml_is_windows(void) {
#ifdef _WIN32
  return 1;
#else
  return 0;
#endif
}

/*|
 * The message for the most recent failure, UTF-8, empty when there is none.
 */
MOONBIT_FFI_EXPORT
moonbit_bytes_t ml_last_error(void) {
  return envelope_ok_str(ml_error_text);
}

/*|
 * Canonical absolute path with symlinks and junctions resolved.
 *
 * This is what the sandbox compares against: a workspace prefix check on the
 * raw input can be bypassed by a link that points outside, while the canonical
 * path cannot.
 */
MOONBIT_FFI_EXPORT
moonbit_bytes_t ml_realpath(const char *path) {
#ifdef _WIN32
  wchar_t *w = utf8_to_wide(path);
  if (w == NULL) {
    set_win32_error("realpath");
    return envelope_error();
  }
  HANDLE h = CreateFileW(
      w, 0, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, NULL,
      OPEN_EXISTING, FILE_FLAG_BACKUP_SEMANTICS, NULL);
  free(w);
  if (h == INVALID_HANDLE_VALUE) {
    set_win32_error("realpath");
    return envelope_error();
  }
  DWORD need = GetFinalPathNameByHandleW(
      h, NULL, 0, FILE_NAME_NORMALIZED | VOLUME_NAME_DOS);
  if (need == 0) {
    CloseHandle(h);
    set_win32_error("realpath");
    return envelope_error();
  }
  wchar_t *out = (wchar_t *)malloc(((size_t)need + 1) * sizeof(wchar_t));
  if (out == NULL) {
    CloseHandle(h);
    SetLastError(ERROR_NOT_ENOUGH_MEMORY);
    set_win32_error("realpath");
    return envelope_error();
  }
  DWORD got = GetFinalPathNameByHandleW(
      h, out, need + 1, FILE_NAME_NORMALIZED | VOLUME_NAME_DOS);
  CloseHandle(h);
  if (got == 0 || got > need) {
    free(out);
    set_win32_error("realpath");
    return envelope_error();
  }
  normalize_final_path(out);
  char *u = wide_to_utf8(out);
  free(out);
  if (u == NULL) {
    set_win32_error("realpath");
    return envelope_error();
  }
  moonbit_bytes_t r = envelope_ok_str(u);
  free(u);
  return r;
#else
  char *resolved = realpath(path, NULL);
  if (resolved == NULL) {
    set_errno_error("realpath");
    return envelope_error();
  }
  moonbit_bytes_t r = envelope_ok_str(resolved);
  free(resolved);
  return r;
#endif
}

/*|
 * Directory entries, newline-separated, excluding "." and "..".
 *
 * A name containing a newline cannot be represented in this format; the name is
 * still returned, with an extra separator. The tools layer documents that as a
 * limitation of the string form rather than hiding it.
 */
MOONBIT_FFI_EXPORT
moonbit_bytes_t ml_list_dir(const char *path) {
#ifdef _WIN32
  wchar_t *w = utf8_to_wide(path);
  if (w == NULL) {
    set_win32_error("list_dir");
    return envelope_error();
  }
  size_t n = wcslen(w);
  wchar_t *pattern = (wchar_t *)malloc((n + 3) * sizeof(wchar_t));
  if (pattern == NULL) {
    free(w);
    SetLastError(ERROR_NOT_ENOUGH_MEMORY);
    set_win32_error("list_dir");
    return envelope_error();
  }
  memcpy(pattern, w, n * sizeof(wchar_t));
  pattern[n] = L'\\';
  pattern[n + 1] = L'*';
  pattern[n + 2] = L'\0';
  free(w);

  WIN32_FIND_DATAW fd;
  HANDLE h = FindFirstFileW(pattern, &fd);
  free(pattern);
  if (h == INVALID_HANDLE_VALUE) {
    set_win32_error("list_dir");
    return envelope_error();
  }
  size_t cap = 256, len = 0;
  char *buf = (char *)malloc(cap);
  if (buf == NULL) {
    FindClose(h);
    SetLastError(ERROR_NOT_ENOUGH_MEMORY);
    set_win32_error("list_dir");
    return envelope_error();
  }
  int rc = 0;
  do {
    if (wcscmp(fd.cFileName, L".") == 0 || wcscmp(fd.cFileName, L"..") == 0) {
      continue;
    }
    char *u = wide_to_utf8(fd.cFileName);
    if (u == NULL) {
      rc = -1;
      break;
    }
    size_t ul = strlen(u);
    if (len + ul + 2 > cap) {
      while (len + ul + 2 > cap) {
        cap *= 2;
      }
      char *grown = (char *)realloc(buf, cap);
      if (grown == NULL) {
        free(u);
        rc = -2;
        break;
      }
      buf = grown;
    }
    if (len > 0) {
      buf[len++] = '\n';
    }
    memcpy(buf + len, u, ul);
    len += ul;
    free(u);
  } while (FindNextFileW(h, &fd));
  DWORD last = GetLastError();
  FindClose(h);
  if (rc != 0) {
    free(buf);
    SetLastError(rc == -2 ? ERROR_NOT_ENOUGH_MEMORY : last);
    set_win32_error("list_dir");
    return envelope_error();
  }
  /* FindNextFileW sets ERROR_NO_MORE_FILES at normal end of enumeration. */
  if (last != ERROR_NO_MORE_FILES) {
    free(buf);
    SetLastError(last);
    set_win32_error("list_dir");
    return envelope_error();
  }
  moonbit_bytes_t r = make_envelope(0, buf, len);
  free(buf);
  return r;
#else
  DIR *d = opendir(path);
  if (d == NULL) {
    set_errno_error("list_dir");
    return envelope_error();
  }
  size_t cap = 256, len = 0;
  char *buf = (char *)malloc(cap);
  if (buf == NULL) {
    closedir(d);
    snprintf(ml_error_text, sizeof ml_error_text, "list_dir: out of memory");
    return envelope_error();
  }
  int failed = 0;
  struct dirent *e;
  errno = 0;
  while ((e = readdir(d)) != NULL) {
    if (strcmp(e->d_name, ".") == 0 || strcmp(e->d_name, "..") == 0) {
      continue;
    }
    size_t ul = strlen(e->d_name);
    if (len + ul + 2 > cap) {
      while (len + ul + 2 > cap) {
        cap *= 2;
      }
      char *grown = (char *)realloc(buf, cap);
      if (grown == NULL) {
        failed = -1;
        break;
      }
      buf = grown;
    }
    if (len > 0) {
      buf[len++] = '\n';
    }
    memcpy(buf + len, e->d_name, ul);
    len += ul;
  }
  int saved = errno;
  closedir(d);
  if (failed != 0) {
    free(buf);
    snprintf(ml_error_text, sizeof ml_error_text, "list_dir: out of memory");
    return envelope_error();
  }
  if (saved != 0) {
    free(buf);
    errno = saved;
    set_errno_error("list_dir");
    return envelope_error();
  }
  moonbit_bytes_t r = make_envelope(0, buf, len);
  free(buf);
  return r;
#endif
}

/*|
 * File size in bytes, or a negative value on failure.
 */
MOONBIT_FFI_EXPORT
int64_t ml_stat_size(const char *path) {
#ifdef _WIN32
  wchar_t *w = utf8_to_wide(path);
  if (w == NULL) {
    set_win32_error("stat_size");
    return -1;
  }
  struct _stat64 st;
  int rc = _wstat64(w, &st);
  free(w);
  if (rc != 0) {
    set_errno_error("stat_size");
    return -1;
  }
  return (int64_t)st.st_size;
#else
  struct stat st;
  if (stat(path, &st) != 0) {
    set_errno_error("stat_size");
    return -1;
  }
  return (int64_t)st.st_size;
#endif
}

/*|
 * 1 if `path` is a directory, 0 if it exists and is not, negative on failure.
 */
MOONBIT_FFI_EXPORT
int32_t ml_is_dir(const char *path) {
#ifdef _WIN32
  wchar_t *w = utf8_to_wide(path);
  if (w == NULL) {
    set_win32_error("is_dir");
    return -1;
  }
  struct _stat64 st;
  int rc = _wstat64(w, &st);
  free(w);
  if (rc != 0) {
    set_errno_error("is_dir");
    return -1;
  }
  return (st.st_mode & _S_IFDIR) != 0 ? 1 : 0;
#else
  struct stat st;
  if (stat(path, &st) != 0) {
    set_errno_error("is_dir");
    return -1;
  }
  return S_ISDIR(st.st_mode) ? 1 : 0;
#endif
}

/*|
 * Read a whole file as UTF-8 text (raw bytes, no validation), up to `max_bytes`.
 *
 * A larger file is an error rather than a truncation: a tool that silently
 * returns the first N bytes of a file gives the model a partial document with
 * no indication that it was cut, which is worse than telling it the file is too
 * large. The limit is checked with a stat before any allocation.
 */
MOONBIT_FFI_EXPORT
moonbit_bytes_t ml_read_text_file(const char *path, int64_t max_bytes) {
  int64_t size = ml_stat_size(path);
  if (size < 0) {
    return envelope_error();
  }
  if (max_bytes >= 0 && size > max_bytes) {
    snprintf(ml_error_text, sizeof ml_error_text,
             "file is %lld bytes, larger than the %lld-byte limit",
             (long long)size, (long long)max_bytes);
    return envelope_error();
  }
  if (size > 0x7FFFFFFF) {
    snprintf(ml_error_text, sizeof ml_error_text,
             "file is too large to read into a 32-bit buffer");
    return envelope_error();
  }
#ifdef _WIN32
  wchar_t *w = utf8_to_wide(path);
  if (w == NULL) {
    set_win32_error("read_file");
    return envelope_error();
  }
  FILE *f = _wfopen(w, L"rb");
  free(w);
  if (f == NULL) {
    set_errno_error("read_file");
    return envelope_error();
  }
#else
  FILE *f = fopen(path, "rb");
  if (f == NULL) {
    set_errno_error("read_file");
    return envelope_error();
  }
#endif
  moonbit_bytes_t raw = moonbit_make_bytes_raw((int32_t)size);
  size_t got = fread(raw, 1, (size_t)size, f);
  int read_err = ferror(f);
  fclose(f);
  if (read_err || (int64_t)got != size) {
    if (read_err) {
      set_errno_error("read_file");
    } else {
      snprintf(ml_error_text, sizeof ml_error_text,
               "short read: got %lld of %lld bytes", (long long)got,
               (long long)size);
    }
    return envelope_error();
  }
  return make_envelope(0, (const char *)raw, (size_t)size);
}

/*
 * Test fixture: a temporary tree with a workspace, a sibling directory outside
 * it, and a symlink from inside the workspace to that sibling.
 *
 *   <root>/ws/inside.txt
 *   <root>/ws/sub/nested.txt
 *   <root>/outside/secret.txt
 *   <root>/ws/escape -> <root>/outside
 *
 * Returns the canonical root path, or an error envelope. This exists only so
 * the sandbox test can exercise the symlink-escape path without a checked-in
 * fixture; nothing in the tools calls it, and no write capability is exposed to
 * the model.
 */
MOONBIT_FFI_EXPORT
moonbit_bytes_t ml_test_make_sandbox(void) {
#ifdef _WIN32
  wchar_t tmp[512];
  DWORD tn = GetTempPathW(512, tmp);
  if (tn == 0 || tn >= 512) {
    set_win32_error("make_sandbox");
    return envelope_error();
  }
  wchar_t root[768];
  int made = 0;
  for (int attempt = 0; attempt < 64; ++attempt) {
    _snwprintf_s(root, 768, _TRUNCATE, L"%smoonlm-sandbox-%lu-%d", tmp,
                (unsigned long)GetCurrentProcessId(), attempt);
    if (CreateDirectoryW(root, NULL)) {
      made = 1;
      break;
    }
    if (GetLastError() != ERROR_ALREADY_EXISTS) {
      set_win32_error("make_sandbox");
      return envelope_error();
    }
  }
  if (!made) {
    snprintf(ml_error_text, sizeof ml_error_text,
             "make_sandbox: could not create a temporary directory");
    return envelope_error();
  }
  wchar_t ws[900], sub[900], outside[900], path[900], link[900];
  _snwprintf_s(ws, 900, _TRUNCATE, L"%s\\ws", root);
  _snwprintf_s(sub, 900, _TRUNCATE, L"%s\\sub", ws);
  _snwprintf_s(outside, 900, _TRUNCATE, L"%s\\outside", root);
  if (!CreateDirectoryW(ws, NULL) || !CreateDirectoryW(sub, NULL) ||
      !CreateDirectoryW(outside, NULL)) {
    set_win32_error("make_sandbox");
    return envelope_error();
  }
  _snwprintf_s(path, 900, _TRUNCATE, L"%s\\inside.txt", ws);
  FILE *f = _wfopen(path, L"wb");
  if (f == NULL) {
    set_errno_error("make_sandbox/step");
    return envelope_error();
  }
  fputs("hello", f);
  fclose(f);
  _snwprintf_s(path, 900, _TRUNCATE, L"%s\\nested.txt", sub);
  f = _wfopen(path, L"wb");
  if (f == NULL) {
    set_errno_error("make_sandbox/file");
    return envelope_error();
  }
  fputs("nested", f);
  fclose(f);
  _snwprintf_s(path, 900, _TRUNCATE, L"%s\\secret.txt", outside);
  f = _wfopen(path, L"wb");
  if (f == NULL) {
    set_errno_error("make_sandbox/file2");
    return envelope_error();
  }
  fputs("secret", f);
  fclose(f);
  _snwprintf_s(link, 900, _TRUNCATE, L"%s\\escape", ws);
  /* 0x2 is SYMBOLIC_LINK_FLAG_ALLOW_UNPRIVILEGED_CREATE; spelled numerically
   * because the SDK header that defines it is newer than some build hosts. */
  DWORD flags = SYMBOLIC_LINK_FLAG_DIRECTORY | 0x2;
  if (!CreateSymbolicLinkW(link, outside, flags)) {
    DWORD err = GetLastError();
    if (err == ERROR_INVALID_PARAMETER) {
      /* Older Windows without unprivileged-create support: retry without it,
       * which succeeds when the test process is elevated. */
      if (CreateSymbolicLinkW(link, outside, SYMBOLIC_LINK_FLAG_DIRECTORY)) {
        goto symlink_ok;
      }
      err = GetLastError();
    }
    SetLastError(err);
    set_win32_error("make_sandbox (symlink)");
    return envelope_error();
  }
symlink_ok:
  char *u = wide_to_utf8(root);
  if (u == NULL) {
    set_win32_error("make_sandbox");
    return envelope_error();
  }
  moonbit_bytes_t canon = ml_realpath(u);
  free(u);
  return canon;
#else
  char tmpl[] = "/tmp/moonlm-sandbox-XXXXXX";
  char *root = mkdtemp(tmpl);
  if (root == NULL) {
    set_errno_error("make_sandbox/file3");
    return envelope_error();
  }
  char ws[512], sub[512], outside[512], path[512], link[512];
  snprintf(ws, sizeof ws, "%s/ws", root);
  snprintf(sub, sizeof sub, "%s/sub", ws);
  snprintf(outside, sizeof outside, "%s/outside", root);
  if (mkdir(ws, 0755) != 0 || mkdir(sub, 0755) != 0 ||
      mkdir(outside, 0755) != 0) {
    set_errno_error("make_sandbox");
    return envelope_error();
  }
  snprintf(path, sizeof path, "%s/inside.txt", ws);
  FILE *f = fopen(path, "wb");
  if (f == NULL) {
    set_errno_error("make_sandbox");
    return envelope_error();
  }
  fputs("hello", f);
  fclose(f);
  snprintf(path, sizeof path, "%s/nested.txt", sub);
  f = fopen(path, "wb");
  if (f == NULL) {
    set_errno_error("make_sandbox");
    return envelope_error();
  }
  fputs("nested", f);
  fclose(f);
  snprintf(path, sizeof path, "%s/secret.txt", outside);
  f = fopen(path, "wb");
  if (f == NULL) {
    set_errno_error("make_sandbox");
    return envelope_error();
  }
  fputs("secret", f);
  fclose(f);
  snprintf(link, sizeof link, "%s/escape", ws);
  if (symlink(outside, link) != 0) {
    set_errno_error("make_sandbox (symlink)");
    return envelope_error();
  }
  return ml_realpath(root);
#endif
}
