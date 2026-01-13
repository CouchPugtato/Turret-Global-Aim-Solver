# Turret-Global-Aim-Solver

A lightweight, static web app for simulating turret auto-aim and projectile trajectories to score in the hub, built for the 2026 FRC Rebuild season.

## Features
- Turret yaw/pitch readouts with Auto Aim Mode dropdown:
  - Pitch Control (adjusts pitch using current exit velocity)
  - Exit Velocity Control (keeps pitch fixed, adjusts exit velocity)
- Turret offset control
- Exit velocity variable
- Variable ball diameter
- Shooting error percentage

## Contributing
Contributions are welcome! Please open a pull request. Keep changes focused and include a short description of the problem or improvement, plus screenshots when relevant. Match the existing code style and keep imports and asset paths relative so the app remains deployable on GitHub Pages. If you modify aiming logic describe the mathematical reasoning and any assumptions. The sim uses inches and seconds internally, e.g. gravity set to 386.09 in/s².

## Math: Turret Aiming and Ballistics
World coordinates use Z as “up”; yaw is rotation around Z. The hub target center is a fixed point in world space.

### Yaw (Heading to Target)
Compute yaw by pointing from the turret base to the target:
$$\theta_{\text{target}} = \mathrm{atan2}(y_T - y_0,\ x_T - x_0)$$
Convert to turret-local yaw by subtracting the robot body heading and normalizing to $[-\pi,\ \pi]$. Store as degrees in $yaw$.

### Projectile Motion and Pitch Control
Let $x$ be horizontal range and $h$ the vertical difference from muzzle to target. Using elevation angle $\theta$ (0° = horizon, 90° = up) and speed $v$, the vertical trajectory is:

$$y = x \tan\theta - \frac{g x^2}{2 v^2\cos^2\theta}$$

Set $y = h$ and $u = \tan\theta$, yielding a quadratic:

$$A u^2 + B u + C = 0$$

with

$$A = \frac{g x^2}{2 v^2},\quad B = -x,\quad C = h + A$$

Solve for $u$ and pick the high arc solution (when valid) to ensure a downward entry. Convert back to elevation $\theta = \arctan(u)$, then to the sim’s pitch convention:

$$\mathrm{pitch} = 90^\circ - \theta_{\text{deg}}$$

### Exit Velocity Control (Fixed Pitch)
Given a fixed pitch, convert to elevation $\theta = 90^\circ - \text{pitch}$. Solve the motion equation for initial speed $v$:

$$v = \sqrt{\frac{g x^2}{2 \cos^2\theta (x \tan\theta - h)}}$$

This requires $(x \tan\theta - h) > 0$ and $\cos\theta \neq 0$. The sim updates $exitVelocity$ to this value, and the UI slider listens to show the updated speed live.
