# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Automatic integration test runs against emulator.
- Add a new npm package "randombytes": "^2.1.0".
- Support device label in message to apply settings
- Use `protobuf` file definitions from a [`git submodule`](http://github.com/skycoin/hardware-wallet-protob.git).
- In `devGenerateMnemonic` message (function) it is possible to specify the `word_count` for the seed.
- In `devRecoveryDevice` message (function) it is possible to specify the `word_count` for the seed.
- Add `word_count` field in `GenerateMnemonic` protobuf message. Supported mnamonic sizes are 12 and 24.
- Functions to sign Skycoin transactions given inputs and ouputs with 64-bit coins and hours values.
- Send external entropy to the device to be combined with internal entropy.

### Fixed

- Use hex dump format to transmit binary buffers (instead of base58 encoding).

### Changed

### Removed

- Removed `protobuf` file from the project.
- Remove fields (`enforce_wordlist`, `type`) from `RecoveryDevice` protobuf message.
- Change protobuf messages for check signature to be consistent with [hardware-wallet](https://github.com/skycoin/hardware-wallet/blob/2648cf384b5455c994ba54acf6a31cd1272c6f66/tiny-firmware/protob/messages.options#L21).

### Fixed

### Security

