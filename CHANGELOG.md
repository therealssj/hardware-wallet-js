# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- [\#41](https://github.com/skycoin/hardware-wallet-js/issues/41)

  - In `devGenerateMnemonic` message (function) you can specify the `word_count` for the seed.

  - In `devRecoveryDevice` message (function) you can specify the `word_count` for the seed.
  
  - Remove fields (`enforce_wordlist`, `type` and `dry_run` ) from `RecoveryDevice` protobuf message.
  
  - Add `word_count` field for `GenerateMnemonic` protobuf message.

### Fixed

### Changed

### Removed

### Fixed

### Security

