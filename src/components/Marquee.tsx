'use client';

import React from 'react';

export default function Marquee() {
  return (
    <div className="marquee-wrap" aria-hidden="true">
      <div className="marquee-content">
        <span className="marquee-item">
          $MEH <span className="marquee-separator"></span> WHATEVER HAPPENS, HAPPENS{' '}
          <span className="marquee-separator"></span> 0% TAX{' '}
          <span className="marquee-separator"></span> 1 BILLION SUPPLY{' '}
          <span className="marquee-separator"></span> 100% COMMUNITY DRIVEN{' '}
          <span className="marquee-separator"></span> LAUNCHING FRIDAY 10AM EST{' '}
          <span className="marquee-separator"></span> MEH{' '}
          <span className="marquee-separator"></span>
        </span>
        <span className="marquee-item">
          $MEH <span className="marquee-separator"></span> WHATEVER HAPPENS, HAPPENS{' '}
          <span className="marquee-separator"></span> 0% TAX{' '}
          <span className="marquee-separator"></span> 1 BILLION SUPPLY{' '}
          <span className="marquee-separator"></span> 100% COMMUNITY DRIVEN{' '}
          <span className="marquee-separator"></span> LAUNCHING FRIDAY 10AM EST{' '}
          <span className="marquee-separator"></span> MEH{' '}
          <span className="marquee-separator"></span>
        </span>
      </div>
    </div>
  );
}
