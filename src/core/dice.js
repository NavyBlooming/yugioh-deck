const u32 = () => crypto.getRandomValues(new Uint32Array(1))[0];

// 0〜n-1 を選ぶ。2^32 を n で割り切れない端の値は捨てて引き直し、偏りを出さない
export function pick(n, rand = u32) {
  const limit = 2 ** 32 - (2 ** 32 % n);
  for (;;) {
    const v = rand();
    if (v < limit) return v % n;
  }
}

export function rollDice(count, rand = u32) {
  const n = count >= 1 && count <= 3 ? count : 1;
  return Array.from({ length: n }, () => pick(6, rand) + 1);
}

export function tossCoin(rand = u32) {
  return pick(2, rand) === 0 ? "表" : "裏";
}
