/* ==========================================================
   boars.js — маленькие кабанчики падают по бокам окна.
   Левая полоса — сразу справа от сайдбара, правая — у края окна.
   Каждый кабанчик живёт сам по себе: своя скорость, размер,
   покачивание и вращение. Обычный скрипт (работает и с file://).
   ========================================================== */
(function () {
  'use strict';

  // true — не показывать кабанчиков тем, у кого в системе отключены анимации
  var RESPECT_REDUCED_MOTION = false;
  if (RESPECT_REDUCED_MOTION && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var IMAGES = ['assets/boars/boar-front.png', 'assets/boars/boar-side.png'];
  var LANE_W = 90;          // ширина полосы падения, px
  var MAX_PER_SIDE = 7;     // одновременно на одной стороне
  var SIZE_MIN = 34, SIZE_MAX = 58;

  var layer = document.createElement('div');
  layer.id = 'boars-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  var boars = [];
  var spawnAt = { left: 0, right: 0 };   // когда можно запускать следующего (мс)

  function rand(a, b) { return a + Math.random() * (b - a); }

  // Границы полосы: левая начинается правее сайдбара (если он виден)
  function laneX(side) {
    var w = window.innerWidth;
    if (side === 'right') return { min: w - LANE_W, max: w - 8 };
    var sb = document.getElementById('sidebar');
    var edge = 0;
    if (sb && w > 760) {
      var r = sb.getBoundingClientRect();
      if (r.width > 0 && r.right > 0) edge = r.right;
    }
    return { min: edge + 6, max: edge + LANE_W };
  }

  function count(side) {
    var n = 0;
    for (var i = 0; i < boars.length; i++) if (boars[i].side === side) n++;
    return n;
  }

  // Нет ли на этой стороне кабанчика, который ещё слишком близко к верху
  // (иначе новый наложится на него)
  function topIsFree(side) {
    for (var i = 0; i < boars.length; i++) {
      if (boars[i].side === side && boars[i].y < SIZE_MAX * 1.5) return false;
    }
    return true;
  }

  function spawn(side) {
    var size = rand(SIZE_MIN, SIZE_MAX);
    var lane = laneX(side);
    var img = document.createElement('img');
    img.className = 'boar';
    img.src = IMAGES[Math.random() < 0.5 ? 0 : 1];
    img.alt = '';
    img.draggable = false;
    img.style.width = size + 'px';
    layer.appendChild(img);
    boars.push({
      el: img,
      side: side,
      size: size,
      x: rand(lane.min, Math.max(lane.min, lane.max - size)),
      y: -size * 1.2,
      vy: rand(55, 130),            // px/сек — чем меньше, тем мягче падает
      swayAmp: rand(6, 16),
      swayFreq: rand(0.8, 1.8),
      phase: rand(0, Math.PI * 2),
      rot: rand(-25, 25),
      vrot: rand(-40, 40) * (Math.random() < 0.5 ? 1 : -1) / 2
    });
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);   // защита от «скачка» после паузы вкладки
    last = now;
    var h = window.innerHeight;

    // Запуск новых: у каждой стороны свой случайный таймер → падают независимо
    ['left', 'right'].forEach(function (side) {
      if (now >= spawnAt[side] && count(side) < MAX_PER_SIDE && topIsFree(side)) {
        spawn(side);
        spawnAt[side] = now + rand(400, 1500);
      }
    });

    for (var i = boars.length - 1; i >= 0; i--) {
      var b = boars[i];
      b.y += b.vy * dt;
      b.rot += b.vrot * dt;
      b.phase += b.swayFreq * dt;
      var dx = Math.sin(b.phase) * b.swayAmp;
      b.el.style.transform =
        'translate3d(' + (b.x + dx).toFixed(1) + 'px,' + b.y.toFixed(1) + 'px,0) rotate(' + b.rot.toFixed(1) + 'deg)';
      if (b.y > h + 10) {
        b.el.remove();
        boars.splice(i, 1);
      }
    }
    requestAnimationFrame(frame);
  }

  // Старт после загрузки, чтобы картинки не тормозили первый показ страницы
  function start() {
    IMAGES.forEach(function (src) { var p = new Image(); p.src = src; });
    spawnAt.left = performance.now() + 400;
    spawnAt.right = performance.now() + 1100;   // справа чуть позже, чтобы не падали синхронно
    last = performance.now();
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
