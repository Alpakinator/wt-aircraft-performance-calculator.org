

<div align="center">
<img width="128px" height="128px" src="static/images/WTAPC_logo_1280.png">
<h1>War Thunder Aircraft<br>Performance Calculator.org</h1>
</div>

[**wtapc.org**](https://www.wtapc.org) - Web app for generating graphs of engine power and power/weight of all piston aircraft in War Thunder, at all altitudes.
---
v.1.0.0
<h3>Current features:</h3>
<ol>
<li>Piston Engine Power</li>
<li>Power/Weight</li>
<li>Interactive 2D graphs</li>
<li>Airplane select with icons</li>
</ol>

### Known issues - contribution appreciated:
1. P-63 A-10, A-5 and C5 engine power graphs don't match ingame engine power very well. These 3 are calculated in a unique way; engine power above critical altitude doesn't drop proportionally to air pressure drop (concave), but in a convex way, and that's difficult to model. (look for `ConstRPM_bends_above_crit_alt` function in `plane_power_calculator`, it's made to distinguish them). 

2. Tu-1 power is almost precise but also not exact. 

3. Planes with constant pitch propeller have differnt RPMs at different speeds, and these scripts don't account for that. As a result, at low speeds those planes have more power on the graphs than in game. To resolve that propeller torque needs to be calculated and prop governor simulated.

<h3>For more information visit:</h3>

the web app, [**the GitHub repository of the calculations**][1] and [**Discord of WTAPC**][2]

<h1 align="left"></h1>

[1]: https://github.com/Alpakinator/wt-aircraft-performance-calculator
[2]: https://discord.gg/6F7ZRk3zJG