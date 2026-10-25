# CFD – Navier-Stokes

Real-time simulation of incompressible flow based on the system of Navier-Stokes equations.

The project is part of the Bachelor's degree thesis on "Mathematical Models and Parallel Computing Methods for Solving the Navier-Stokes Equations on Graphics Processing Units".

- Stable Fluids – advances the velocity field each time step by applying advection, external forces and pressure projection as separate operators.
- MAC Staggered Grid – stores pressure at cell centres and velocity components on cell faces, avoiding checkerboard pressure oscillations.
- Semi-Lagrangian Advection – traces every sample backwards along the flow and interpolates the transported quantity, staying stable for any time step.
- Pressure Projection – enforces incompressibility by solving the Poisson equation for pressure and subtracting its gradient from the velocity field.
- Jacobi and SOR Iterations – solve the discrete Poisson equation in parallel on the GPU and with successive over-relaxation on the CPU.
- Vorticity Confinement – restores small-scale vortices damped by the numerical dissipation of advection.

## Usage

```sh
npm install
npm run dev
```

## License

Copyright (c) 2025 Vlad Matsko. Released under the MIT License.

## References

- [Stam, J. (2003). Real-Time Fluid Dynamics for Games. Proceedings of the Game Developer Conference.](https://graphics.cs.cmu.edu/nsp/course/15-464/Spring11/papers/StamFluidforGames.pdf)
- [Bridson, R. (2007). Fluid Simulation for Computer Graphics. University of British Columbia.](https://www.cs.ubc.ca/~rbridson/fluidsimulation/)
- [Harris, M. (2004). "Fast Fluid Dynamics Simulation on the GPU". In GPU Gems, Chapter 38. NVIDIA Corporation.](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu)
- [Van Dyke, M. (1982). An Album of Fluid Motion. Stanford University.](https://courses.washington.edu/me431/handouts/Album-Fluid-Motion-Van-Dyke.pdf)
