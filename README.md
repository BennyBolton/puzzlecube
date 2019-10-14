PUZZLE CUBE
===========
Version 1.0.0

Just a simple rubik's cube simulator/solver made to explore my curiosity
regarding setting up a data model for representing a cube configuration, and
rendering the cube in 3d, allowing the mouse to be used to make changes,
additionally how solving a cube may be implemented.

This program serves no real purpose beyond an exercise for myself.

BUILDING
--------

To build, run `npm install` and `npm run build`. This will build the
`public/build.js` file from the typescript source.

USAGE
-----

Once build, the program can be used either by opening `public/index.html`
directly, or by running `node . <port>` to launch a quick web server that can
be used to access it. The program has only been tested using Chrome, though it
will require a modern browser supporting ES6 features.

In the program, the left mouse button can be to alter cube, and either the
right mouse button, or the left mouse button when clicking off of the cube, can
be used to rotate the cube.

Various settings, include the cube size, can be altered by opening the settings
pane by clicking at the left side of the screen. These settings will take
effect immediately, and are stored in LocalStorage so that they are retained
after closing the page.

`Reset`, `Undo` and `Redo` buttons are made available at the top of the screen.
The `Shuffle` button can be used to continuously shuffle the cube until the
cube is clicked on. The `Solve` button can be used to run the solver, which
only works for size 2 and 3 cubes. The `Test Solver` button can be used to run
a series of attempts of solving random cubes at the current size, with the
results being displayed in an alert window.
