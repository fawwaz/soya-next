# Soya Next Scripts
A CLI which contains configuration and scripts used by [soya-next-cli](../soya-next-cli).

## Installation
To install it, run the following:

```bash
npm install --save soya-next-scripts
```

> Note: We recommend to use [soya-next-cli](../soya-next-cli) instead for installation.

## Usage
To start your server, run the following:

```bash
soya-next-scripts start
```

To build for production, run the following:

```bash
soya-next-scripts build
```

To analyze output bundles, run the following:

```bash
ANALYZE=1 soya-next-scripts build
```

To run unit tests, run the following:

```bash
soya-next-scripts test
```

To eject configuration and scripts, run the following:

```bash
soya-next-scripts eject
```

> Warning: Eject is permanent, so once it's ejected there's no going back.