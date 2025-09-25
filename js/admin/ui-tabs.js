export function initTabs() {
  const tabs = document.querySelectorAll('[data-tab-target]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab-target');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active', 'hidden'));
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      const content = document.getElementById(`${target}-tab-content`);
      if (content) content.classList.remove('hidden');
      tab.classList.add('active');
    });
  });

  if (!document.querySelector('.tab-button.active')) {
    const first = document.querySelector('.tab-button');
    if (first) first.click();
  }
}
