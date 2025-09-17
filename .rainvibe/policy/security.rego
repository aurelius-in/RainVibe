package rainvibe.security

default allow = true

# Example: forbid hardcoded secrets markers
deny[msg] {
  contains(input.diff, "***REDACTED***")
  msg := "Diff appears to include redacted secrets."
}

