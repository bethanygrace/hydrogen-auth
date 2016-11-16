# Hydrogen Auth Plugin

A brute-force approach to remote gateway authentication.

This package for [Atom](https://atom.io/), is a plugin for [Hydrogen](https://github.com/nteract/hydrogen).

It allows connecting to password-protected notebook servers and gateways. However, the approach taken to achieve this involves some heavy monkey-patching. There is no guarantee that it won't break other atom packages.

Please note that notebook servers with self-signed certificates are not supported, due to the default security policy in nodejs/Atom.

## How to use

1. Make sure the gateway or notebook server you are connected to is part of your hydrogen `gateways` config.
2. Activate the `hydrogen` package (by running any command in that package).
3. Run the **Hydrogen Auth: Login to Gateway** command and select your gateway.
4. Double-check that the login URL specified is correct, and then input your password.
5. Now run **Hydrogen: Connect to Remote Kernel**. If the password you entered was correct, you will be prompted to create or select a session. If your login did not succeed, you will instead be given an error message.

## Troubleshooting

* _"Hydrogen v1.0.0+ has to be running"_: this may signal that you don't have the right version of `hydrogen` installed. It may also mean that you have not yet activated the `hydrogen` package (to activate it, run any command belonging to the package)
* _Connecting to the gateway fails, even after entering a login_: Please make sure that the notebook server is running, and that the login URL and password are correct.
* Self-signed certificates are not supported. Consider using Let's Encrypt for public servers, and alternative authentication (e.g. SSH tunneling or http basic auth via nginx proxy) for private servers.

## TODO

The following features are currently unsupported. (Though patches are welcome!)
* Support for multi-user notebook servers
* Figure out a user-configurable method of adding trusted certificates (or wait for node.js to support using the system certificate store)
* Integrate code from this package into `@jupyterlab/services` and `hydrogen`, such that a separate package is not necessary.
