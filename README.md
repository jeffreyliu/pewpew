README.md

Log

10/26/13
Implemented approximate collision detection, seems to work for most regular cases. Decreasing size of time step is helpful, and have not run into any performance issues yet. We should keep it in mind, however that it gets unstable and overlap still happens when v_max * dt ~ 1/10 dimension of object.

Collision with player ship works, and the basic push laser seems to work, but some glitching weird behavior at edge case (where the laser would have pushed the ball off the screen, there's a big discontinuity and it pops back into the canvas.)

-Jeff

Next TODO steps: non-linear wall generation, health/damage modeling, how to trigger/schedule events, keeping track of points/performance, how to integrate the fluids into the game.

--------------------------------------------------