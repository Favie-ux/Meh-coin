'use client';

import React, { useRef, useEffect } from 'react';

export default function SidewaysChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pointsCount = 70;
    const basePrice = 0.00000042;
    const data: number[] = [];

    for (let i = 0; i < pointsCount; i++) {
      const jitter =
        Math.sin(i * 0.4) * 0.000000004 + (Math.random() - 0.5) * 0.000000002;
      data.push(basePrice + jitter);
    }

    let mouseX = -1;
    let isHovering = false;

    function draw() {
      if (!canvas || !ctx) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;

      const width = rect.width;
      const height = rect.height;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const padL = 40;
      const padR = 120;
      const padT = 30;
      const padB = 40;
      const chartW = width - padL - padR;
      const chartH = height - padT - padB;

      const min = basePrice - 0.00000001;
      const max = basePrice + 0.00000001;

      const getX = (i: number) => padL + (i / (pointsCount - 1)) * chartW;
      const getY = (val: number) => padT + chartH - ((val - min) / (max - min)) * chartH;

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      for (let i = 0; i <= 4; i++) {
        const y = padT + (i / 4) * chartH;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(width - padR, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Annotations
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#71717a';
      ctx.textAlign = 'left';
      ctx.fillText('RESISTANCE: Too much effort', padL + 10, padT + 14);
      ctx.fillText('SUPPORT: Rock bottom (Comfy)', padL + 10, padT + chartH - 10);
      ctx.fillText('TREND: Chronic Sideways (0.00%)', padL + 10, padT + chartH / 2 - 6);

      // Line Chart
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(data[0]));
      for (let i = 1; i < pointsCount; i++) {
        ctx.lineTo(getX(i), getY(data[i]));
      }
      ctx.strokeStyle = '#f4f4f5';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Area gradient
      ctx.lineTo(getX(pointsCount - 1), padT + chartH);
      ctx.lineTo(getX(0), padT + chartH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Flatline EMA
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      const midY = getY(basePrice);
      ctx.moveTo(padL, midY);
      ctx.lineTo(width - padR, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Right label
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('$0.00000042', width - padR + 10, midY + 4);

      // Crosshair
      if (isHovering && mouseX >= padL && mouseX <= width - padR) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);

        ctx.beginPath();
        ctx.moveTo(mouseX, padT);
        ctx.lineTo(mouseX, padT + chartH);
        ctx.stroke();

        ctx.setLineDash([]);
        const ttW = 160;
        const ttH = 46;
        const ttX = Math.min(width - ttW - 10, Math.max(10, mouseX - ttW / 2));
        const ttY = padT + 10;

        ctx.fillStyle = '#18181d';
        ctx.strokeStyle = '#3f3f46';
        ctx.fillRect(ttX, ttY, ttW, ttH);
        ctx.strokeRect(ttX, ttY, ttW, ttH);

        ctx.fillStyle = '#f4f4f5';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('Action: Hold & Relax', ttX + 10, ttY + 18);
        ctx.fillStyle = '#71717a';
        ctx.fillText('Volatility: 0.00% (Dead)', ttX + 10, ttY + 34);
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      isHovering = true;
      draw();
    };

    const handleMouseLeave = () => {
      isHovering = false;
      draw();
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', draw);

    draw();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', draw);
    };
  }, []);

  return (
    <div className="container" style={{ paddingBottom: '88px' }}>
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title-wrap">
            <h3>Technical Analysis: The Crabbing Index</h3>
            <p>Real-time simulated chart of chronic market indifference</p>
          </div>
          <div className="chart-stats-row">
            <div className="chart-stat-item">
              <span>24h Change:</span> <strong>0.00%</strong>
            </div>
            <div className="chart-stat-item">
              <span>RSI (14):</span> <strong>50.0 (Zen)</strong>
            </div>
            <div className="chart-stat-item">
              <span>Fear &amp; Greed:</span> <strong>Meh</strong>
            </div>
          </div>
        </div>

        <div className="canvas-container">
          <canvas ref={canvasRef} id="chartCanvas" />
        </div>
      </div>
    </div>
  );
}
