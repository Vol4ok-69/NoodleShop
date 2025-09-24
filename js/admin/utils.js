export function initTabs() {
    const tabs = document.querySelectorAll('[data-tab-target]');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab-target');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.getElementById(`${target}-tab-content`).classList.add('active');
            tab.classList.add('active');
        });
    });
    
    if (tabs.length > 0) {
        tabs[0].click();
    }
}