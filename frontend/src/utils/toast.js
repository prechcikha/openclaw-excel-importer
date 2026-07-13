// Simple Toast Notification System
class ToastManager {
  constructor() {
    this.toasts = [];
    this.toastIdCounter = 0;
  }

  getToastId() {
    return `toast_${Date.now()}_${++this.toastIdCounter}`;
  }

  add(message, type = 'info', duration = 5000) {
    const toastId = this.getToastId();
    
    // Remove any existing toasts with the same message
    this.toasts = this.toasts.filter(t => t.message !== message);
    
    const toast = { id: toastId, message, type, duration, createdAt: Date.now() };
    this.toasts.push(toast);
    
    // Auto-remove after duration (unless dismissible)
    if (!toast.dismissed) {
      setTimeout(() => {
        this.remove(toastId);
      }, duration);
    }
  }

  remove(id) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  success(message, duration = 5000) {
    this.add(message, 'success', duration);
  }

  error(message, duration = 10000) {
    this.add(message, 'danger', duration);
  }

  warning(message, duration = 8000) {
    this.add(message, 'warning', duration);
  }

  info(message, duration = 5000) {
    this.add(message, 'info', duration);
  }

  render() {
    return (
      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        {this.toasts.map(toast => (
          <div 
            key={toast.id}
            className={`toast show align-items-center text-white mb-2 ${
              toast.type === 'success' ? 'bg-success' :
              toast.type === 'danger' ? 'bg-danger' :
              toast.type === 'warning' ? 'bg-warning' : 'bg-info'
            }`}
          >
            <div className="d-flex">
              <div className="toast-body">
                {toast.message}
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => this.remove(toast.id)}
              ></button>
            </div>
          </div>
        ))}
      </div>
    );
  }
}

// Singleton instance
export const toast = new ToastManager();
export default toast;
