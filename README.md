# Sim.ts

A library heavily based on the [Sim.js lib](https://simjs.z5.web.core.windows.net/), developed by Maneesh Varshney. In fact, Sim.js was downloaded and rewritten into typescipt. It does not support all the features of the original library, because some raised errors and were not needed anyways.

## License

The original library is licensed under the LGPL, so this lib is LGPL as well.

## Modifications
- migrated from javascript to typescipt
- added support for realtime execution
  - you can set a `timestepDuration` and set `realtime` to `true`
  - every tick in the simulation lasts as long as the time set in `timestepDuration`
  - notice, that if you set `timestepDuration = 1000` and the next event in the simulation takes place in 5 ticks, the time needed will be 5 seconds
- uses now class syntax instead of functions and prototyping
- some bug fixes occuring due to the changes to class syntax
- no subclasses of Sim anymore, every subclass is now its own class with Prefix `Sim`
- classes were distributed into different files for more readability
- added abstract class `Entity` which an entity for the sim has to extend
  - all entities have access to the same Sim and Random instance
  - also every entity has their own SimPopulation stats
- added utility class, which lets you format a number (milliseconds) to a string
- ARG_CHECK got removed entirely
- removed the `processing discipline` from `SimFacility`. It raised errors, but wasn't needed anyways so it got removed
- added a `getTop` method to the SimPQueue class
- added some tests
