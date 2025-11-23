# time-pack

Need a scheduler that isn't cron or Windows based? time-pack has that in node.js. WIP

[![npm version](https://img.shields.io/npm/v/time-pack.svg)](https://www.npmjs.com/package/time-pack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`time-pack` is an ultra-simplified way to handle dates and times. 

---

## Features

 - Feature 1: Gets a current date string for the four time zones in the USA: Pacific, Mountain, Central, Eastern.

---

## Installation

Install the package using npm:

```bash
npm install time-pack

```

## Usage

```
const t = require("time-pack");

console.log(t.GetCurrentDate("Eastern"));
```

Or:

```
const { GetCurrentDate } = require("time-pack");

console.log(GetCurrentDate("Eastern"));
```

Output will be today's current date according to Eastern time.

