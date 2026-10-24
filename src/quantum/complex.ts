import { Complex } from '../types/quantum';

const EPSILON = 1e-9;

export function complex(re: number = 0, im: number = 0): Complex {
  return {
    re: Math.abs(re) < EPSILON ? 0 : re,
    im: Math.abs(im) < EPSILON ? 0 : im,
  };
}

export function cZero(): Complex {
  return { re: 0, im: 0 };
}

export function cOne(): Complex {
  return { re: 1, im: 0 };
}

export function cI(): Complex {
  return { re: 0, im: 1 };
}

export function cAdd(a: Complex, b: Complex): Complex {
  return complex(a.re + b.re, a.im + b.im);
}

export function cSub(a: Complex, b: Complex): Complex {
  return complex(a.re - b.re, a.im - b.im);
}

export function cMul(a: Complex, b: Complex): Complex {
  return complex(
    a.re * b.re - a.im * b.im,
    a.re * b.im + a.im * b.re
  );
}

export function cScale(a: Complex, s: number): Complex {
  return complex(a.re * s, a.im * s);
}

export function cDiv(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  if (denom < EPSILON) {
    throw new Error('Division by zero in complex arithmetic');
  }
  return complex(
    (a.re * b.re + a.im * b.im) / denom,
    (a.im * b.re - a.re * b.im) / denom
  );
}

export function cConj(a: Complex): Complex {
  return complex(a.re, -a.im);
}

export function cAbs(a: Complex): number {
  return Math.hypot(a.re, a.im);
}

export function cAbsSq(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}

export function cArg(a: Complex): number {
  if (Math.abs(a.re) < EPSILON && Math.abs(a.im) < EPSILON) {
    return 0;
  }
  return Math.atan2(a.im, a.re);
}

export function cFromPolar(r: number, theta: number): Complex {
  return complex(r * Math.cos(theta), r * Math.sin(theta));
}

export function cEquals(a: Complex, b: Complex, tol: number = 1e-6): boolean {
  return Math.abs(a.re - b.re) < tol && Math.abs(a.im - b.im) < tol;
}

/**
 * Formats a complex number into standard mathematical notation:
 * e.g., "0.707 + 0.707i", "1", "i", "-0.5 - 0.866i"
 */
export function formatComplex(c: Complex, precision: number = 3): string {
  const re = Math.abs(c.re) < EPSILON ? 0 : c.re;
  const im = Math.abs(c.im) < EPSILON ? 0 : c.im;

  if (re === 0 && im === 0) return '0';
  if (im === 0) return re.toFixed(precision).replace(/\.?0+$/, '') || '0';
  if (re === 0) {
    if (Math.abs(im - 1) < EPSILON) return 'i';
    if (Math.abs(im + 1) < EPSILON) return '-i';
    const imStr = im.toFixed(precision).replace(/\.?0+$/, '');
    return `${imStr}i`;
  }

  const sign = im >= 0 ? '+' : '-';
  const absIm = Math.abs(im);
  const imFormatted = Math.abs(absIm - 1) < EPSILON ? 'i' : `${absIm.toFixed(precision).replace(/\.?0+$/, '')}i`;
  const reFormatted = re.toFixed(precision).replace(/\.?0+$/, '');

  return `${reFormatted} ${sign} ${imFormatted}`;
}
