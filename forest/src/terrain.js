/*

Terrain Level
    Made up up Terrain Squares

Terrain Square:
    Contains the terrain info -- heightmap (or mesh), collision mesh, textures, etc.
    Contains all the hand-placed instanced props scattered on it
    Should have a box for frustum culling.
    
How big is a Terrain Square in memory? How many can I load into memory before having issues?  
Eventually, this stuff is going to have to not all be in memory all the time.

So, going to end up having a pool of each kind of prop and a pool of terrain 
tile instances that are offset in the vertex shader based off a heightmap.

So, what is the general flow:

Load up all the prop assets.
Load up the level.
Load up the square [descriptions].

Create the squares we want active (based on player position).
1. Set up the terrain for the square (i.e., plug the right data into the instance -- heightmap?, painting mask?)
2. Set up the collision for the terrain.
3. Set up all the props -- populate matrices into some common instance mesh of that type of prop.
4. Set up the prop colliders -- pull colliders from a pool and attach them to the square's "Group"





[2021.05.24]
Get instanced terrain rendering working.
1. Start by getting a simple terrain vertex shader that reads from a heightmap.
2. Apply it to an instanced mesh that reads from segments of the heightmap.

*/

