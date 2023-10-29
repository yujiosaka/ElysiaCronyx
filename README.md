# ElysiaCronyx [![npm version](https://badge.fury.io/js/elysia-cronyx.svg)](https://badge.fury.io/js/elysia-cronyx) [![CI/CD](https://github.com/yujiosaka/ElysiaCronyx/actions/workflows/ci_cd.yml/badge.svg)](https://github.com/yujiosaka/ElysiaCronyx/actions/workflows/ci_cd.yml)

###### [Code of Conduct](https://github.com/yujiosaka/CronyxServer/blob/main/docs/CODE_OF_CONDUCT.md) | [Contributing](https://github.com/yujiosaka/CronyxServer/blob/main/docs/CONTRIBUTING.md) | [Changelog](https://github.com/yujiosaka/CronyxServer/blob/main/docs/CHANGELOG.md)

A plugin to harness the power of [Cronyx](https://github.com/yujiosaka/Cronyx)'s script-based task scheduling in your [Elysia](https://elysiajs.com/) applications.

## 🌟 Features

<img src="https://github.com/yujiosaka/ElysiaCronyx/assets/2261067/c007f42c-894c-43b2-842a-18a94462db25" alt="icon" width="300" align="right">

Integrate Cronyx directly with Elysia applications and enable a world of seamless task scheduling.

## 🚀 Getting Started

### Installation

Install the Cronyx and ElysiaCronyx plugin using `bun`:

```sh
$ bun add cronyx elysia-cronyx
```

### Integration with Elysia

For integration with the Elysia web framework:

```ts
// MysqlJobStore, PostgresJobStore and RedisJobStore are also available for the integration
import { MongodbJobStore } from "cronyx";
import cronyx from "cronyx-server";
import Elysia from "elysia";

const jobStore = await MongodbJobStore.connect("mongodb://mongo:27017/db");
const app = new Elysia().use(cronyx({ jobStore })).listen(3000);
console.log(`CronyxServer is running at ${app.server?.hostname}:${app.server?.port}`);
```

## ⚙️ Configuration

- `jobStore`: [BaseJobStore] - Cronyx's job store instance.
- `timezone?` (**optional**): [string] - Defaults to local timezone if not provided.

## 💻 Development

Using Visual Studio Code and the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension, you can simplify the development environment setup process. The extension allows you to develop inside a Docker container and automatically sets up the development environment for you.

1. Install the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension in Visual Studio Code.

2. Clone the repository:

```sh
git clone https://github.com/yujiosaka/ElysiaCronyx.git
```

3. Open the cloned repository in Visual Studio Code.

4. When prompted by Visual Studio Code, click "Reopen in Container" to open the project inside the Docker container.

5. The extension will build the Docker container and set up the development environment for you. This may take a few minutes.

6. Build and run the Docker container with Docker Compose:

```sh
$ docker-compose up --build
```

This will start testing in watch mode.

## 🐞 Debugging tips

### Enable debug logging

Job status changes are logged via the [debug](https://github.com/visionmedia/debug) module under the `cronyx:elysia` namespace.

```sh
env DEBUG="cronyx:elysia" bun server.js
```

## 💳 License

This project is licensed under the MIT License. See [LICENSE](https://github.com/yujiosaka/Cronyx/blob/main/LICENSE) for details.

[BaseJobStore]: https://github.com/yujiosaka/Cronyx/blob/main/docs/API.md#job-stores "BaseJobStore"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
