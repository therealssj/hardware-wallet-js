# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- In `devGenerateMnemonic` message (function) it is possible to specify the `word_count` for the seed.
- In `devRecoveryDevice` message (function) it is possible to specify the `word_count` for the seed.
- Add `word_count` field in `GenerateMnemonic` protobuf message.

### Fixed

### Changed

### Removed

- Remove fields (`enforce_wordlist`, `type` and `dry_run` ) from `RecoveryDevice` protobuf message.

### Fixed

### Security

