/**
 * DrawingApp 类 - 触摸绘图应用
 */
class DrawingApp {
    /**
     * 初始化绘图应用
     */
    constructor() {
        this.canvas = document.getElementById('drawing-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.isDrawing = false;          // 是否正在绘制
        this.currentTool = 'pencil';     // 当前选中的工具
        this.brushSize = 5;              // 画笔大小
        this.color = '#000000';          // 画笔颜色
        this.lastX = 0;                  // 上一次绘制的 X 坐标
        this.lastY = 0;                  // 上一次绘制的 Y 坐标
        this.undoStack = [];             // 撤销栈
        this.redoStack = [];             // 重做栈
        this.saveState = null;           // 当前状态的临时保存

        this.initializeCanvas();
        this.setupEventListeners();
    }

    /**
     * 初始化画布
     * 设置画布大小并添加窗口大小改变事件监听
     */
    initializeCanvas() {
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            const rect = container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            // 设置画布的显示大小
            this.canvas.style.width = `${rect.width}px`;
            this.canvas.style.height = `${rect.height}px`;
            
            // 设置画布的实际大小（考虑设备像素比）
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
            
            // 根据设备像素比缩放上下文
            this.ctx.scale(dpr, dpr);
            
            // 重新设置上下文的样式
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.brushSize;
            this.ctx.globalCompositeOperation = 'source-over';
        };

        // 初始调整大小
        resizeCanvas();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            resizeCanvas();
            requestAnimationFrame(() => {
                this.ctx.putImageData(imageData, 0, 0);
            });
        });
        
        // 监听设备方向变化
        window.addEventListener('orientationchange', () => {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            setTimeout(() => {
                resizeCanvas();
                requestAnimationFrame(() => {
                    this.ctx.putImageData(imageData, 0, 0);
                });
            }, 100);
        });
    }

    /**
     * 设置事件监听器
     * 包括工具选择、颜色选择、画笔大小调节和绘画事件等
     */
    setupEventListeners() {
        // 工具选择事件
        document.querySelectorAll('.tool').forEach(tool => {
            tool.addEventListener('click', (e) => {
                document.querySelector('.tool.active').classList.remove('active');
                e.currentTarget.classList.add('active');
                this.currentTool = e.currentTarget.id;
            });
        });

        // 颜色选择事件
        const colorPicker = document.getElementById('color-picker');
        colorPicker.addEventListener('input', (e) => {
            this.color = e.target.value;
        });

        // 画笔大小调节事件
        const brushSize = document.getElementById('brush-size');
        brushSize.addEventListener('input', (e) => {
            this.brushSize = e.target.value;
        });

        // 触摸绘画事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const [x, y] = this.getTouchPos(touch);
            
            this.isDrawing = true;
            this.lastX = x;
            this.lastY = y;
            
            // 开始新的路径
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            
            if (this.currentTool === 'pencil') {
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.strokeStyle = this.color;
                this.ctx.lineWidth = this.brushSize;
            } else if (this.currentTool === 'eraser') {
                this.ctx.globalCompositeOperation = 'destination-out';
                this.ctx.lineWidth = this.brushSize;
            }
            
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            this.saveState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isDrawing) return;
            
            const touch = e.touches[0];
            const [x, y] = this.getTouchPos(touch);
            
            if (this.currentTool === 'pencil' || this.currentTool === 'eraser') {
                // 直接画线到新位置
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            } else if (this.currentTool === 'rectangle' || this.currentTool === 'circle') {
                // 恢复上一次的状态
                this.ctx.putImageData(this.saveState, 0, 0);
                
                if (this.currentTool === 'rectangle') {
                    this.ctx.strokeRect(
                        this.lastX,
                        this.lastY,
                        x - this.lastX,
                        y - this.lastY
                    );
                } else {
                    const radiusX = Math.abs(x - this.lastX) / 2;
                    const radiusY = Math.abs(y - this.lastY) / 2;
                    const centerX = this.lastX + (x - this.lastX) / 2;
                    const centerY = this.lastY + (y - this.lastY) / 2;
                    
                    this.ctx.beginPath();
                    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
                    this.ctx.stroke();
                }
            }
            
            // 更新最后的位置
            this.lastX = x;
            this.lastY = y;
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.isDrawing) {
                this.isDrawing = false;
                this.ctx.closePath();
                this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
                this.redoStack = [];
                this.updateUndoRedoButtons();
            }
        }, { passive: false });

        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            if (this.isDrawing) {
                this.isDrawing = false;
                this.ctx.closePath();
                this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
                this.redoStack = [];
                this.updateUndoRedoButtons();
            }
        }, { passive: false });

        // 撤销/重做事件
        document.getElementById('undo').addEventListener('click', this.undo.bind(this));
        document.getElementById('redo').addEventListener('click', this.redo.bind(this));

        // 清空画布事件
        document.getElementById('clear').addEventListener('click', this.clearCanvas.bind(this));

        // 保存绘图事件
        document.getElementById('save').addEventListener('click', this.saveDrawing.bind(this));
    }

    /**
     * 撤销上一步操作
     */
    undo() {
        if (this.undoStack.length > 0) {
            const currentState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.redoStack.push(currentState);
            const previousState = this.undoStack.pop();
            this.ctx.putImageData(previousState, 0, 0);
            this.updateUndoRedoButtons();
        }
    }

    /**
     * 重做上一步撤销的操作
     */
    redo() {
        if (this.redoStack.length > 0) {
            const currentState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.undoStack.push(currentState);
            const nextState = this.redoStack.pop();
            this.ctx.putImageData(nextState, 0, 0);
            this.updateUndoRedoButtons();
        }
    }

    /**
     * 清空画布
     */
    clearCanvas() {
        const currentState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.undoStack.push(currentState);
        this.redoStack = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateUndoRedoButtons();
    }

    /**
     * 保存绘图
     */
    saveDrawing() {
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    /**
     * 更新撤销/重做按钮状态
     */
    updateUndoRedoButtons() {
        document.getElementById('undo').disabled = this.undoStack.length === 0;
        document.getElementById('redo').disabled = this.redoStack.length === 0;
    }

    /**
     * 获取触摸点在画布上的坐标
     * @param {Touch} touch - 触摸事件对象
     * @returns {Array} - [x, y] 坐标数组
     */
    getTouchPos(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width); // 调整坐标
        const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height); // 调整坐标
        
        return [x, y];
    }
}

// 当页面加载完成时初始化应用
window.addEventListener('load', () => {
    new DrawingApp();
});
