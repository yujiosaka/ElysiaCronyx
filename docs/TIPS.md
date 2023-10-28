# Tips

## Enable debug logging

Job status changes are logged via the [debug](https://github.com/visionmedia/debug) module under the `cronyx:elysia` namespace.

```sh
env DEBUG="cronyx:elysia" node script.js
# or
# env DEBUG="cronyx:elysia" bun script.js
```
