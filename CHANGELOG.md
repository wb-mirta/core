## [0.5.3](https://github.com/wb-mirta/core/compare/v0.5.2...v0.5.3) (2026-05-08)


### Bug Fixes

* **mirta-cli:** prompt key passphrase on macos ([#261](https://github.com/wb-mirta/core/issues/261)) ([9a5e95d](https://github.com/wb-mirta/core/commit/9a5e95d7f69e720a0a987ea7a5f3dd091e69137a))



## [0.5.2](https://github.com/wb-mirta/core/compare/v0.5.1...v0.5.2) (2026-04-09)


### Features

* **mirta-testing:** add virtual device support ([#250](https://github.com/wb-mirta/core/issues/250)) ([658915d](https://github.com/wb-mirta/core/commit/658915d9b9f588c1bcd0a7f658d9c6fca3562688))



## [0.5.1](https://github.com/wb-mirta/core/compare/v0.5.0...v0.5.1) (2026-03-25)


### Bug Fixes

* **mirta-rollup:** always replace NODE_ENV in es5 ([#244](https://github.com/wb-mirta/core/issues/244)) ([c860a65](https://github.com/wb-mirta/core/commit/c860a65dfc3da07e9123cefc7cf05234210097f8))



# [0.5.0](https://github.com/wb-mirta/core/compare/v0.4.12...v0.5.0) (2026-03-03)


### Bug Fixes

* **create-mirta:** condition for package projects ([#233](https://github.com/wb-mirta/core/issues/233)) ([3a6a5de](https://github.com/wb-mirta/core/commit/3a6a5de8bff8a8fd1275178ecb5d7509e9b32a64))


### Features

* **create-mirta:** add release workflow ([#231](https://github.com/wb-mirta/core/issues/231)) ([8d3c749](https://github.com/wb-mirta/core/commit/8d3c749dfc89e62fb29d60ce611f955dea98b04d))
* **mirta-rollup:** use minimal string escaping ([#225](https://github.com/wb-mirta/core/issues/225)) ([5a2f8f4](https://github.com/wb-mirta/core/commit/5a2f8f42c217cb52f4bb2b90586f006310472371))
* **mirta-testing:** add dev state to simulator ([#237](https://github.com/wb-mirta/core/issues/237)) ([61d0dc0](https://github.com/wb-mirta/core/commit/61d0dc064548d1a31850d8624d42eb2292f138d2))


### BREAKING CHANGES

* **mirta-testing:** Упрощены публичные сигнатуры инициализации симулятора и правил (без опций). Единое хранилище dev для всех значений и синхронизация состояния.



## [0.4.12](https://github.com/wb-mirta/core/compare/v0.4.11...v0.4.12) (2026-02-21)


### Features

* **create-mirta:** add telegram template ([#221](https://github.com/wb-mirta/core/issues/221)) ([c75f965](https://github.com/wb-mirta/core/commit/c75f9651d184f6c6e4ab3ff66c054b259fdf3126))



## [0.4.11](https://github.com/wb-mirta/core/compare/v0.4.10...v0.4.11) (2026-02-06)


### Bug Fixes

* **mirta-cli:** skip missing source directories ([#215](https://github.com/wb-mirta/core/issues/215)) ([497a8be](https://github.com/wb-mirta/core/commit/497a8be5a55c543b542b678ca4dcbfd8622db659))
* **mirta-rollup:** output resolution for wb-rules ([#213](https://github.com/wb-mirta/core/issues/213)) ([8e89749](https://github.com/wb-mirta/core/commit/8e897494497d719c2aa7b8bf7b1c243e02ffb70d))



## [0.4.10](https://github.com/wb-mirta/core/compare/v0.4.9...v0.4.10) (2026-02-04)


### Bug Fixes

* **mirta-rollup:** handle ts files by babel ([#211](https://github.com/wb-mirta/core/issues/211)) ([ea1f596](https://github.com/wb-mirta/core/commit/ea1f596689913d992968a37c5dd010fdc3b37bd2))



## [0.4.9](https://github.com/wb-mirta/core/compare/v0.4.8...v0.4.9) (2026-02-04)


### Bug Fixes

* **mirta-rollup:** avoid use strict in runtime ([#209](https://github.com/wb-mirta/core/issues/209)) ([f247bd6](https://github.com/wb-mirta/core/commit/f247bd6057d235fe199b0ab9343c6b916051bd05))


### Features

* **create-mirta:** rename sites to projects ([#205](https://github.com/wb-mirta/core/issues/205)) ([e02eb55](https://github.com/wb-mirta/core/commit/e02eb55cccd8719ecc734492290f5a2dacd7f580))
* **mirta-testing:** add timer mocks ([#203](https://github.com/wb-mirta/core/issues/203)) ([2506f2e](https://github.com/wb-mirta/core/commit/2506f2e0b63f6a513f78ea5aa3f369ccd3440c87))



## [0.4.8](https://github.com/wb-mirta/core/compare/v0.4.7...v0.4.8) (2026-01-22)


### Bug Fixes

* **mirta-cli:** handle password auth in deploy ([#198](https://github.com/wb-mirta/core/issues/198)) ([c98b3b0](https://github.com/wb-mirta/core/commit/c98b3b0c482cecb418960b1dc97f87a8b7f316e4))


### Features

* **create-mirta:** add TS badge in npm packages ([#199](https://github.com/wb-mirta/core/issues/199)) ([d3bbba9](https://github.com/wb-mirta/core/commit/d3bbba951b98da606e34b5fb8117d4bedcd18252))



## [0.4.7](https://github.com/wb-mirta/core/compare/v0.4.6...v0.4.7) (2026-01-20)


### Bug Fixes

* add tslib dependency, remove unused rpt2 ([#196](https://github.com/wb-mirta/core/issues/196)) ([31c53c9](https://github.com/wb-mirta/core/commit/31c53c96d466166a29e6c64fd883169ed5aa3bbf))



## [0.4.6](https://github.com/wb-mirta/core/compare/v0.4.5...v0.4.6) (2026-01-20)


### Features

* **create-mirta:** add src mappings, env types ([#195](https://github.com/wb-mirta/core/issues/195)) ([d206d49](https://github.com/wb-mirta/core/commit/d206d493c9f01540d59edd4f016f5a2dc87029c3))
* **mirta-rollup:** unify runtime build ([#193](https://github.com/wb-mirta/core/issues/193)) ([c2ce0f7](https://github.com/wb-mirta/core/commit/c2ce0f7a0ef5511a073045a33974a55ce16e2bda))



## [0.4.5](https://github.com/wb-mirta/core/compare/v0.4.4...v0.4.5) (2026-01-19)


### Features

* **mirta-cli:** prompt on unknown SSH host ([#189](https://github.com/wb-mirta/core/issues/189)) ([c6fb410](https://github.com/wb-mirta/core/commit/c6fb41010e9a83aad374eca020b0b604452ba392))
* **mirta-testing:** add format(), block xformat() ([#191](https://github.com/wb-mirta/core/issues/191)) ([7a6545e](https://github.com/wb-mirta/core/commit/7a6545ef7af67821495851ae16a9cdf9dd5f3201))



## [0.4.4](https://github.com/wb-mirta/core/compare/v0.4.3...v0.4.4) (2026-01-10)


### Bug Fixes

* **create-mirta:** template generator issues ([#185](https://github.com/wb-mirta/core/issues/185)) ([1ea5150](https://github.com/wb-mirta/core/commit/1ea51505cedeebaf7d0835dd862e273af8afdada))



## [0.4.3](https://github.com/wb-mirta/core/compare/v0.4.2...v0.4.3) (2026-01-10)


### Bug Fixes

* patch critical release issues ([#184](https://github.com/wb-mirta/core/issues/184)) ([897ce4d](https://github.com/wb-mirta/core/commit/897ce4d800326aa805ab279e73403c0c79ceff59))



## [0.4.2](https://github.com/wb-mirta/core/compare/v0.4.1...v0.4.2) (2026-01-10)


### Bug Fixes

* **create-mirta:** compound features and installer ([#183](https://github.com/wb-mirta/core/issues/183)) ([0a29b45](https://github.com/wb-mirta/core/commit/0a29b4501e55fdc88af1de893991345b45add6ee))



## [0.4.1](https://github.com/wb-mirta/core/compare/v0.4.0...v0.4.1) (2026-01-10)


### Bug Fixes

* **create-mirta:** adjust locales path ([#182](https://github.com/wb-mirta/core/issues/182)) ([aa528f2](https://github.com/wb-mirta/core/commit/aa528f252fdf6e85830acbef2ed0695c1df33a6f))



# [0.4.0](https://github.com/wb-mirta/core/compare/v0.3.5...v0.4.0) (2026-01-10)


### Bug Fixes

* **mirta-cli:** root level protection ([#181](https://github.com/wb-mirta/core/issues/181)) ([04535a7](https://github.com/wb-mirta/core/commit/04535a7275374defb5ba4d431c9f30ab2fb45ce5))


### Features

* **config:** migrate to jsonc ([#175](https://github.com/wb-mirta/core/issues/175)) ([aa11d80](https://github.com/wb-mirta/core/commit/aa11d8050a7f6997f8d9fc3f05455f7c15f59c83))
* **create-mirta:** add mono templates ([#177](https://github.com/wb-mirta/core/issues/177)) ([2670522](https://github.com/wb-mirta/core/commit/26705225b6f1a04f6e0236543b54470d3a367eee))
* **create-mirta:** revamp generator ([#171](https://github.com/wb-mirta/core/issues/171)) ([b31f3d6](https://github.com/wb-mirta/core/commit/b31f3d63b9944ccafd20750f938ab22938f7f15f))
* **create:** move Vitest setup to @mirta/testing ([#107](https://github.com/wb-mirta/core/issues/107)) ([5f773d0](https://github.com/wb-mirta/core/commit/5f773d064e714a03e19caa3b7ea933c4a24cc2a8))
* introduce staged-args package ([#161](https://github.com/wb-mirta/core/issues/161)) ([427a47d](https://github.com/wb-mirta/core/commit/427a47dbc05711852ecc78d7e31a4baa5af90ae9))
* **mirta-basics:** add utils, revamp guards ([#134](https://github.com/wb-mirta/core/issues/134)) ([ad20305](https://github.com/wb-mirta/core/commit/ad203057c0c637a61a44338089af9cfb5355f4a0))
* **mirta-cli:** add deploy module ([#157](https://github.com/wb-mirta/core/issues/157)) ([d8bf015](https://github.com/wb-mirta/core/commit/d8bf015c58cc4c7cc7b5338b81737efc21092360))
* **mirta-cli:** add modular runner system ([#153](https://github.com/wb-mirta/core/issues/153)) ([4b4df8e](https://github.com/wb-mirta/core/commit/4b4df8e67011ce559aa97c33e092f7c85cf5234d))
* **mirta-cli:** add Trusted Publisher check ([#180](https://github.com/wb-mirta/core/issues/180)) ([1fc3065](https://github.com/wb-mirta/core/commit/1fc30650fa6cb1b88157ef856b6dd186b047c663))
* **mirta-cli:** migrate to `@mirta/staged-args` ([#166](https://github.com/wb-mirta/core/issues/166)) ([3688fee](https://github.com/wb-mirta/core/commit/3688feea8a044cb52401508408e75edcb2de37d5))
* **mirta-cli:** migrate to workspace package API ([#130](https://github.com/wb-mirta/core/issues/130)) ([912c5f0](https://github.com/wb-mirta/core/commit/912c5f031a1f7380ca3c9e43668c72273c0c8c2d))
* **mirta-cli:** rewrite CLI options to kebab-case ([#132](https://github.com/wb-mirta/core/issues/132)) ([712fed7](https://github.com/wb-mirta/core/commit/712fed7565c7ec8d7c02dc1c14e41cb2c934a5ce))
* **mirta-globals:** add Branded utility type ([#144](https://github.com/wb-mirta/core/issues/144)) ([f886f0b](https://github.com/wb-mirta/core/commit/f886f0be4dc1a8b9e9483fe25681b60f43a84789))
* **mirta-globals:** add rule management ([#148](https://github.com/wb-mirta/core/issues/148)) ([c8f789c](https://github.com/wb-mirta/core/commit/c8f789c3e99541d824152ae1bdec7262f18c1208))
* **mirta-i18n:** add t.plain support ([#169](https://github.com/wb-mirta/core/issues/169)) ([6246be7](https://github.com/wb-mirta/core/commit/6246be7ddcc70b5be375296dea9e7502b098f52b))
* **mirta-i18n:** introduce i18n subsystem ([#146](https://github.com/wb-mirta/core/issues/146)) ([03475ee](https://github.com/wb-mirta/core/commit/03475eee778d0025b3732fdb752703fe3d612cf9))
* **mirta-rollup:** add multi-manager support ([#110](https://github.com/wb-mirta/core/issues/110)) ([3359a2d](https://github.com/wb-mirta/core/commit/3359a2d30c98faccb73e6feb10c326cb4b606638))
* **mirta-rollup:** expose context detection API ([#117](https://github.com/wb-mirta/core/issues/117)) ([0922b96](https://github.com/wb-mirta/core/commit/0922b968920e07e826f2bf0946f0814941ed44de))
* **mirta-rollup:** extract env-loader to package ([#125](https://github.com/wb-mirta/core/issues/125)) ([7e86d70](https://github.com/wb-mirta/core/commit/7e86d70e35cd40a014c1f8bfb15c9e5878751900))
* **mirta-rollup:** extract utils into packages ([#123](https://github.com/wb-mirta/core/issues/123)) ([ff586f0](https://github.com/wb-mirta/core/commit/ff586f0befdab175a6e299b1967953ac05920a3a))
* **mirta-rollup:** migrate to dotenvx, unify env ([#104](https://github.com/wb-mirta/core/issues/104)) ([f60b591](https://github.com/wb-mirta/core/commit/f60b5910676c13a4a4144a80237e4e8342d4558c))
* **mirta-store:** add getters, actions, scopes ([#140](https://github.com/wb-mirta/core/issues/140)) ([909bdff](https://github.com/wb-mirta/core/commit/909bdff81fad849ddb420fdd8ed90ab465dee49a))
* **mirta-testing:** provide Vitest default config ([#121](https://github.com/wb-mirta/core/issues/121)) ([ab48bc2](https://github.com/wb-mirta/core/commit/ab48bc2adb60f330159205d8649210dadc4ea996))


### BREAKING CHANGES

* **mirta-rollup:** Remove dependency on dotenv-run and its Rollup/Vitest-specific configurations. Update project configuration files to use @mirta/rollup/env-loader



# [0.4.0](https://github.com/wb-mirta/core/compare/v0.3.5...v0.4.0) (2026-01-10)


### Bug Fixes

* **mirta-cli:** root level protection ([#181](https://github.com/wb-mirta/core/issues/181)) ([04535a7](https://github.com/wb-mirta/core/commit/04535a7275374defb5ba4d431c9f30ab2fb45ce5))


### Features

* **config:** migrate to jsonc ([#175](https://github.com/wb-mirta/core/issues/175)) ([aa11d80](https://github.com/wb-mirta/core/commit/aa11d8050a7f6997f8d9fc3f05455f7c15f59c83))
* **create-mirta:** add mono templates ([#177](https://github.com/wb-mirta/core/issues/177)) ([2670522](https://github.com/wb-mirta/core/commit/26705225b6f1a04f6e0236543b54470d3a367eee))
* **create-mirta:** revamp generator ([#171](https://github.com/wb-mirta/core/issues/171)) ([b31f3d6](https://github.com/wb-mirta/core/commit/b31f3d63b9944ccafd20750f938ab22938f7f15f))
* **create:** move Vitest setup to @mirta/testing ([#107](https://github.com/wb-mirta/core/issues/107)) ([5f773d0](https://github.com/wb-mirta/core/commit/5f773d064e714a03e19caa3b7ea933c4a24cc2a8))
* introduce staged-args package ([#161](https://github.com/wb-mirta/core/issues/161)) ([427a47d](https://github.com/wb-mirta/core/commit/427a47dbc05711852ecc78d7e31a4baa5af90ae9))
* **mirta-basics:** add utils, revamp guards ([#134](https://github.com/wb-mirta/core/issues/134)) ([ad20305](https://github.com/wb-mirta/core/commit/ad203057c0c637a61a44338089af9cfb5355f4a0))
* **mirta-cli:** add deploy module ([#157](https://github.com/wb-mirta/core/issues/157)) ([d8bf015](https://github.com/wb-mirta/core/commit/d8bf015c58cc4c7cc7b5338b81737efc21092360))
* **mirta-cli:** add modular runner system ([#153](https://github.com/wb-mirta/core/issues/153)) ([4b4df8e](https://github.com/wb-mirta/core/commit/4b4df8e67011ce559aa97c33e092f7c85cf5234d))
* **mirta-cli:** add Trusted Publisher check ([#180](https://github.com/wb-mirta/core/issues/180)) ([1fc3065](https://github.com/wb-mirta/core/commit/1fc30650fa6cb1b88157ef856b6dd186b047c663))
* **mirta-cli:** migrate to `@mirta/staged-args` ([#166](https://github.com/wb-mirta/core/issues/166)) ([3688fee](https://github.com/wb-mirta/core/commit/3688feea8a044cb52401508408e75edcb2de37d5))
* **mirta-cli:** migrate to workspace package API ([#130](https://github.com/wb-mirta/core/issues/130)) ([912c5f0](https://github.com/wb-mirta/core/commit/912c5f031a1f7380ca3c9e43668c72273c0c8c2d))
* **mirta-cli:** rewrite CLI options to kebab-case ([#132](https://github.com/wb-mirta/core/issues/132)) ([712fed7](https://github.com/wb-mirta/core/commit/712fed7565c7ec8d7c02dc1c14e41cb2c934a5ce))
* **mirta-globals:** add Branded utility type ([#144](https://github.com/wb-mirta/core/issues/144)) ([f886f0b](https://github.com/wb-mirta/core/commit/f886f0be4dc1a8b9e9483fe25681b60f43a84789))
* **mirta-globals:** add rule management ([#148](https://github.com/wb-mirta/core/issues/148)) ([c8f789c](https://github.com/wb-mirta/core/commit/c8f789c3e99541d824152ae1bdec7262f18c1208))
* **mirta-i18n:** add t.plain support ([#169](https://github.com/wb-mirta/core/issues/169)) ([6246be7](https://github.com/wb-mirta/core/commit/6246be7ddcc70b5be375296dea9e7502b098f52b))
* **mirta-i18n:** introduce i18n subsystem ([#146](https://github.com/wb-mirta/core/issues/146)) ([03475ee](https://github.com/wb-mirta/core/commit/03475eee778d0025b3732fdb752703fe3d612cf9))
* **mirta-rollup:** add multi-manager support ([#110](https://github.com/wb-mirta/core/issues/110)) ([3359a2d](https://github.com/wb-mirta/core/commit/3359a2d30c98faccb73e6feb10c326cb4b606638))
* **mirta-rollup:** expose context detection API ([#117](https://github.com/wb-mirta/core/issues/117)) ([0922b96](https://github.com/wb-mirta/core/commit/0922b968920e07e826f2bf0946f0814941ed44de))
* **mirta-rollup:** extract env-loader to package ([#125](https://github.com/wb-mirta/core/issues/125)) ([7e86d70](https://github.com/wb-mirta/core/commit/7e86d70e35cd40a014c1f8bfb15c9e5878751900))
* **mirta-rollup:** extract utils into packages ([#123](https://github.com/wb-mirta/core/issues/123)) ([ff586f0](https://github.com/wb-mirta/core/commit/ff586f0befdab175a6e299b1967953ac05920a3a))
* **mirta-rollup:** migrate to dotenvx, unify env ([#104](https://github.com/wb-mirta/core/issues/104)) ([f60b591](https://github.com/wb-mirta/core/commit/f60b5910676c13a4a4144a80237e4e8342d4558c))
* **mirta-store:** add getters, actions, scopes ([#140](https://github.com/wb-mirta/core/issues/140)) ([909bdff](https://github.com/wb-mirta/core/commit/909bdff81fad849ddb420fdd8ed90ab465dee49a))
* **mirta-testing:** provide Vitest default config ([#121](https://github.com/wb-mirta/core/issues/121)) ([ab48bc2](https://github.com/wb-mirta/core/commit/ab48bc2adb60f330159205d8649210dadc4ea996))


### BREAKING CHANGES

* **mirta-rollup:** Remove dependency on dotenv-run and its Rollup/Vitest-specific configurations. Update project configuration files to use @mirta/rollup/env-loader



## [0.3.5](https://github.com/wb-mirta/core/compare/v0.3.4...v0.3.5) (2025-10-25)


### Bug Fixes

* **ast:** skip mono/external resolved source paths ([#94](https://github.com/wb-mirta/core/issues/94)) ([1be783e](https://github.com/wb-mirta/core/commit/1be783e01a2592558885b6ea7a9787db4f9b70c3))
* **mirta-rollup:** resolve dts paths using AST ([#87](https://github.com/wb-mirta/core/issues/87)) ([0e16daf](https://github.com/wb-mirta/core/commit/0e16daf2b50786e76e02e04e7226ef7aeb817439))


### Features

* **build:** exclude monorepo deps from bundle ([#96](https://github.com/wb-mirta/core/issues/96)) ([173551b](https://github.com/wb-mirta/core/commit/173551b798f99e0f5165769fd85494ba5a5fad22))
* **mirta-rollup:** add skipExports option ([#91](https://github.com/wb-mirta/core/issues/91)) ([60d3929](https://github.com/wb-mirta/core/commit/60d3929ac214c6de18249243de581598f32c9ac9))
* **mirta-rollup:** autodetect workspaces via pnpm ([#98](https://github.com/wb-mirta/core/issues/98)) ([cb04fdf](https://github.com/wb-mirta/core/commit/cb04fdfc9cef2fb9dff4cdb98078aabdba301274))
* **mirta-rollup:** revamp exports & bindings ([#85](https://github.com/wb-mirta/core/issues/85)) ([92e552a](https://github.com/wb-mirta/core/commit/92e552a389a5193f489b760555c510da299c45fd))
* switch to @mirta/rollup, add public copy ([#100](https://github.com/wb-mirta/core/issues/100)) ([9994d4f](https://github.com/wb-mirta/core/commit/9994d4f0fb59f2f8bd1f3635dd9fbd6f63feac78))



## [0.3.4](https://github.com/wb-mirta/core/compare/v0.3.3...v0.3.4) (2025-10-14)


### Bug Fixes

* **mirta-rollup:** disable the cache for rpt2 ([#81](https://github.com/wb-mirta/core/issues/81)) ([0a0d5b8](https://github.com/wb-mirta/core/commit/0a0d5b81f8743438b315484457ad29739a13e8bd))


### Features

* **mirta-rollup:** add multi-entry npm build mode ([#83](https://github.com/wb-mirta/core/issues/83)) ([6e71fce](https://github.com/wb-mirta/core/commit/6e71fce9e5f3d0f93a42c6e4c0f724a7760cf851))



## [0.3.3](https://github.com/wb-mirta/core/compare/v0.3.2...v0.3.3) (2025-10-12)


### Bug Fixes

* **mirta-cli:** use proper exit code for errors ([#77](https://github.com/wb-mirta/core/issues/77)) ([e24cbea](https://github.com/wb-mirta/core/commit/e24cbea53e5c4d0b4b0303447bd5fcfdc4e1e85e))


### Features

* **mirta-globals:** allow mocking of Notify ([#74](https://github.com/wb-mirta/core/issues/74)) ([001af48](https://github.com/wb-mirta/core/commit/001af4829eff85d0955624fdfdf5d96ed62de253))
* **mirta-globals:** introduce Alarms definitions ([#76](https://github.com/wb-mirta/core/issues/76)) ([57480f4](https://github.com/wb-mirta/core/commit/57480f40faeec83dd7235690bd04efde7dd07838))



## [0.3.2](https://github.com/wb-mirta/core/compare/v0.3.1...v0.3.2) (2025-10-09)


### Bug Fixes

* **mirta-rollup:** normalize nested deps paths ([#66](https://github.com/wb-mirta/core/issues/66)) ([1393d3c](https://github.com/wb-mirta/core/commit/1393d3c3bd614cead5bbc80649f7aeb1179769bd))


### Features

* **mirta-globals:** add control-specific types ([#68](https://github.com/wb-mirta/core/issues/68)) ([2bf7b1c](https://github.com/wb-mirta/core/commit/2bf7b1c1cbe9c7d5327cbe84a6aab47e01ae5134))
* **mirta-globals:** allow to log any data type ([#70](https://github.com/wb-mirta/core/issues/70)) ([4d7992c](https://github.com/wb-mirta/core/commit/4d7992ca7cd2b2ee21784a4d7355fd22bf91e6f7))
* **mirta-globals:** support Telegram messages ([#72](https://github.com/wb-mirta/core/issues/72)) ([9f1dc25](https://github.com/wb-mirta/core/commit/9f1dc2542c932418cf2d5233c249a072605c5f4d))



# [0.3.0](https://github.com/wb-mirta/core/compare/v0.2.8...v0.3.0) (2025-10-06)


### Features

* introduce & migrate to mirta-cli ([#62](https://github.com/wb-mirta/core/issues/62)) ([14bde24](https://github.com/wb-mirta/core/commit/14bde24251640a02d68b76572f8c3a6690f088f7))
* **mirta-rollup:** add ESNext config for NPM ([#59](https://github.com/wb-mirta/core/issues/59)) ([565d730](https://github.com/wb-mirta/core/commit/565d730ccf0fe7a972121d13f1f3bf23dd59ade2))



## [0.2.8](https://github.com/wb-mirta/core/compare/v0.2.6...v0.2.8) (2025-09-28)


### Bug Fixes

* **globals:** improve Device & Control ([#48](https://github.com/wb-mirta/core/issues/48)) ([d8d06ca](https://github.com/wb-mirta/core/commit/d8d06cac24b5a04d9fc495046d6c4a1ed58c1060))


### Features

* **create-mirta:** migrate to subpath imports ([#52](https://github.com/wb-mirta/core/issues/52)) ([1d4376b](https://github.com/wb-mirta/core/commit/1d4376b542d7607da2e5e1fff32ab7e39b12f175))
* **create-mirta:** move examples to the repo root ([#50](https://github.com/wb-mirta/core/issues/50)) ([10b171a](https://github.com/wb-mirta/core/commit/10b171acfc705388723a9a00df7b873ed34023a8))



## [0.2.6](https://github.com/wb-mirta/core/compare/v0.2.5...v0.2.6) (2025-09-15)


### Features

* **globals:** add declaration for StorableObject ([#43](https://github.com/wb-mirta/core/issues/43)) ([3d28b0b](https://github.com/wb-mirta/core/commit/3d28b0b62ad83626df9e6f977d14c9800531c0ed))



## [0.2.5](https://github.com/wb-mirta/core/compare/v0.2.4...v0.2.5) (2025-09-03)


### Bug Fixes

* **create-mirta:** change vitest plugin for eslint ([#38](https://github.com/wb-mirta/core/issues/38)) ([9770317](https://github.com/wb-mirta/core/commit/977031782fdcc3b7a7fcf20916c715b5fc72adfc))



## [0.2.4](https://github.com/wb-mirta/core/compare/v0.2.3...v0.2.4) (2025-09-03)


### Features

* **mirta-globals:** add cron support ([#34](https://github.com/wb-mirta/core/issues/34)) ([b8e09cd](https://github.com/wb-mirta/core/commit/b8e09cd68b543f2899864a2209a7f4d0813e003b))



## [0.2.3](https://github.com/wb-mirta/core/compare/v0.2.2...v0.2.3) (2025-08-29)


### Features

* handle JavaScript by Rollup and Vitest ([#32](https://github.com/wb-mirta/core/issues/32)) ([67900ec](https://github.com/wb-mirta/core/commit/67900ecf6929836f8d334704da42a102cdca4d46))



## [0.2.2](https://github.com/wb-mirta/core/compare/v0.2.1...v0.2.2) (2025-08-25)


### Features

* **create-mirta:** allow JS during TS migration ([#22](https://github.com/wb-mirta/core/issues/22)) ([16e1344](https://github.com/wb-mirta/core/commit/16e1344a93bb13818c33c8db693cc4ca0b0ff412))



## [0.2.1](https://github.com/wb-mirta/core/compare/v0.2.0...v0.2.1) (2025-08-24)


### Bug Fixes

* **mirta:** add boolean conversion for mqtt values ([#20](https://github.com/wb-mirta/core/issues/20)) ([1390f0e](https://github.com/wb-mirta/core/commit/1390f0eb4c9a9b2c35e2e6a81a8b7e9394976645))


### Features

* **create-mirta:** improve dotenv support ([#16](https://github.com/wb-mirta/core/issues/16)) ([1e36e38](https://github.com/wb-mirta/core/commit/1e36e389ee25a03c1f3f09bf3c0044f73b6af913))
* **mirta-rollup:** add array-includes support ([#19](https://github.com/wb-mirta/core/issues/19)) ([a0a92a3](https://github.com/wb-mirta/core/commit/a0a92a31b4e705a23619e74a48fc8080e06ebced))



# [0.2.0](https://github.com/wb-mirta/core/compare/v0.1.2...v0.2.0) (2025-08-20)


### Features

* **mirta:** replace readonly with changePolicy ([#14](https://github.com/wb-mirta/core/issues/14)) ([55fa5cf](https://github.com/wb-mirta/core/commit/55fa5cf9dd68dae2df348ad77f76d77a7b6737b9))



## [0.1.2](https://github.com/wb-mirta/core/compare/v0.1.1...v0.1.2) (2025-08-18)


### Features

* **mirta:** simplify event handlers registration ([#12](https://github.com/wb-mirta/core/issues/12)) ([d226d83](https://github.com/wb-mirta/core/commit/d226d832fe1460c3de10017337bddfda53aee875))



## [0.1.1](https://github.com/wb-mirta/core/compare/v0.1.0...v0.1.1) (2025-08-17)


### Bug Fixes

* **mirta:** control value getter returns itself ([#8](https://github.com/wb-mirta/core/issues/8)) ([61ef35a](https://github.com/wb-mirta/core/commit/61ef35a6a14691fbf4229d9a209c62b2c8532a75))
* **mirta:** pass missing options to createControl ([#10](https://github.com/wb-mirta/core/issues/10)) ([2504998](https://github.com/wb-mirta/core/commit/25049981f2bf1af697d7da865d2f12dbec8c48ed))



# [0.1.0](https://github.com/wb-mirta/core/compare/v0.0.7...v0.1.0) (2025-08-16)


### Bug Fixes

* **mirta:** virtual device numbering ([8381a70](https://github.com/wb-mirta/core/commit/8381a70690f8c21a4edd220093baf304f2e92ab5))


### Features

* add composable support ([#6](https://github.com/wb-mirta/core/issues/6)) ([e1d294a](https://github.com/wb-mirta/core/commit/e1d294ad62c74ef15f13d1ed0da0ab3c0d5ffc7e))
* **mirta-basics:** improve useEvent (closes [#1](https://github.com/wb-mirta/core/issues/1), closes [#2](https://github.com/wb-mirta/core/issues/2)) ([1e2962c](https://github.com/wb-mirta/core/commit/1e2962c26c83ae24f3e1105244524c7ce7455f30))



## [0.0.7](https://github.com/wb-mirta/core/compare/v0.0.6...v0.0.7) (2025-08-08)


### Bug Fixes

* **create-mirta:** change dev type ([797e2f6](https://github.com/wb-mirta/core/commit/797e2f625ef11f82f7f0e95b775b32d7e09c11cf))



## [0.0.6](https://github.com/wb-mirta/core/compare/v0.0.5...v0.0.6) (2025-08-06)


### Bug Fixes

* **mirta-rollup:** external packages, no strict ([9638769](https://github.com/wb-mirta/core/commit/9638769fa5c0da504806a92f88b36fa0babc34bb))



## [0.0.5](https://github.com/wb-mirta/core/compare/v0.0.4...v0.0.5) (2025-08-06)


### Features

* **mirta-globals:** add units to control def ([d5615d2](https://github.com/wb-mirta/core/commit/d5615d232f2b9e14f910a84872fb604e7a9ddb8c))



## [0.0.4](https://github.com/wb-mirta/core/compare/v0.0.3...v0.0.4) (2025-08-05)


### Bug Fixes

* **mirta-globals:** allow PersistentStorage ([a5e822c](https://github.com/wb-mirta/core/commit/a5e822cb6497241098719ed5a9eba92ad4c8868a))
* **mirta-globals:** declare dev just as object ([4e52f95](https://github.com/wb-mirta/core/commit/4e52f95a1826fadcd45305d483a9d421f25e5e1d))


### Features

* **create-mirta:** change wb-rules, add examples ([ce99499](https://github.com/wb-mirta/core/commit/ce9949984190bc117c900617faa6e44d36ea7904))



## [0.0.3](https://github.com/wb-mirta/core/compare/v0.0.2...v0.0.3) (2025-07-29)


### Bug Fixes

* **mirta-rollup:** align dist build of only script ([0c4dfd3](https://github.com/wb-mirta/core/commit/0c4dfd3cc598ea16d284b73074c7a3766ca622e8))


### Features

* **create-mirta:** add deployment command setup ([9867dbd](https://github.com/wb-mirta/core/commit/9867dbd4695ae1e15c59b37c01d8198dfb9587cb))



## 0.0.2 (2025-07-27)

Maintenance release

