# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add a new npm package "secure-random": "^1.1.1"
- Add an entropy field in `GenerateMnemonic`.
- In `devGenerateMnemonic` message (function) it is possible to specify the `word_count` for the seed.
- In `devRecoveryDevice` message (function) it is possible to specify the `word_count` for the seed.
- Add `word_count` field in `GenerateMnemonic` protobuf message.

### Fixed

### Changed

- Get device entropy (secure-random) to send it in `GenerateMnemonic`.

### Removed

- Remove GetEntropy and Entropy msg.
- Remove fields (`enforce_wordlist`, `type`) from `RecoveryDevice` protobuf message.
- Change protobuf messages for check signature to be consistent with [harware-wallet](https://github.com/skycoin/hardware-wallet/blob/2648cf384b5455c994ba54acf6a31cd1272c6f66/tiny-firmware/protob/messages.options#L21).

### Fixed

### Security

