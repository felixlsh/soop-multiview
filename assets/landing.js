(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  function animate(element, frames, duration = 300) {
    if (reduce.matches || typeof element.animate !== 'function') return;
    const animation = element.animate(frames, { duration, easing: 'cubic-bezier(.22,1,.36,1)' });
    animations.add(animation);
    animation.finished.catch(() => {}).finally(() => animations.delete(animation));
    return animation;
  }
  reduce.addEventListener?.('change', () => { if (reduce.matches) for (const animation of animations) animation.cancel(); });
  if ('IntersectionObserver' in window && !reduce.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) {
        animate(entry.target, [{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}], 420);
        observer.unobserve(entry.target);
      }});
    }, { threshold: .08 });
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
  }
  const descriptions = {
    chat: ['수신한 대화 전체에서 검색', '지정 키워드·계정·매니저의 채팅은 선택해 보관하고, 전체 임시 채팅에서는 검색과 제재 대상의 대화를 확인하세요. 재입장 기록은 회차를 구분해 함께 조회합니다.'],
    donations: ['후원 종류와 누적을 한눈에', '일반·영상 별풍선, 도전·대결 미션과 애드벌룬을 구분해 확인하세요. 후원자별 누적은 종류별로 계산하고, 기준 이상 후원은 Glow 효과와 알림으로 강조합니다.'],
    moderation: ['제재 대상이 남긴 대화까지', '강퇴와 채금을 구분하고 어느 방송인지 바로 확인하세요. 직전 대화와 최신 5개 채팅을 먼저 보고, 펼치면 해당 입장 회차에서 수신한 전체 대화를 볼 수 있습니다.'],
    alerts: ['알림을 모으고 관련 대화 확인', '키워드·제재·대량 후원·고정 방송 시작을 한곳에 모아보세요. 검색과 조건을 접어두고 관련 채팅을 펼치거나 방송 화면으로 이동할 수 있습니다.']
  };
  const tabs = document.querySelector('.record-tabs');
  const preview = document.querySelector('.record-preview');
  const buttons = Array.from(tabs.querySelectorAll('button'));
  const marker = tabs.querySelector('.tab-marker');
  const panels = Array.from(preview.querySelectorAll('[data-panel]'));
  const description = document.querySelector('.record-description');
  let active = buttons[0];
  function positionMarker(withMotion) {
    const next = active.offsetLeft;
    const old = marker.dataset.x ? Number(marker.dataset.x) : next;
    marker.style.width = `${active.offsetWidth}px`;
    marker.style.transform = `translateX(${next}px)`;
    marker.dataset.x = String(next);
    if (withMotion) animate(marker, [{transform:`translateX(${old}px)`},{transform:`translateX(${next}px)`}], 240);
  }
  function select(button, withMotion = true) {
    if (active === button && tabs.dataset.enhanced) return;
    active = button;
    buttons.forEach(item => { item.setAttribute('aria-selected', String(item === active)); item.tabIndex = item === active ? 0 : -1; });
    panels.forEach(panel => { panel.hidden = panel.dataset.panel !== active.dataset.record; });
    const [title, text] = descriptions[active.dataset.record];
    description.querySelector('strong').textContent = title;
    description.querySelector('p').textContent = text;
    positionMarker(withMotion);
    if (withMotion) {
      animations.forEach(animation => { if (animation.effect?.target === description || panels.includes(animation.effect?.target)) animation.cancel(); });
      animate(panels.find(panel => !panel.hidden), [{opacity:.1,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}], 220);
      animate(description, [{opacity:.25,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}], 180);
    }
  }
  tabs.setAttribute('role', 'tablist');
  buttons.forEach(button => {
    button.setAttribute('role','tab');
    button.setAttribute('aria-controls',`preview-${button.dataset.record}`);
    button.addEventListener('click', () => select(button));
  });
  panels.forEach(panel => { panel.setAttribute('role','tabpanel'); panel.setAttribute('aria-labelledby',`tab-${panel.dataset.panel}`); });
  select(buttons[0], false);
  tabs.dataset.enhanced = 'true'; preview.dataset.enhanced = 'true';
  positionMarker(false);
  tabs.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const current = buttons.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus(); select(buttons[next]);
  });
  if ('ResizeObserver' in window) new ResizeObserver(() => positionMarker(false)).observe(tabs);
  else window.addEventListener('resize', () => positionMarker(false), { passive:true });
  document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => {
    if (detail.open) animate(detail.querySelector('p'), [{opacity:0,transform:'translateY(-3px)'},{opacity:1,transform:'translateY(0)'}], 160);
  }));
})();
