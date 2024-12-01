/**
 * DrawingApp 类 - 在线绘图应用的核心类
 * 实现了画布初始化、工具切换、绘图功能和历史记录等功能
 */
class DrawingApp {
    /**
     * 构造函数 - 初始化绘图应用
     * 设置画布、上下文和默认绘图状态
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
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.saveState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
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

        // 鼠标绘画事件
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // 触摸绘画事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const [x, y, pressure] = this.getTouchPos(touch);
            this.isDrawing = true;
            this.lastX = x;
            this.lastY = y;
            if (pressure !== 1.0) {
                this.ctx.lineWidth = this.brushSize * pressure;
            }
            this.saveState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isDrawing) return;
            const touch = e.touches[0];
            const [x, y, pressure] = this.getTouchPos(touch);
            
            if (pressure !== 1.0) {
                this.ctx.lineWidth = this.brushSize * pressure;
            }
            
            this.draw({ clientX: x, clientY: y });
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });

        // 撤销/重做事件
        document.getElementById('undo').addEventListener('click', this.undo.bind(this));
        document.getElementById('redo').addEventListener('click', this.redo.bind(this));

        // 清空画布事件
        document.getElementById('clear').addEventListener('click', this.clearCanvas.bind(this));

        // 保存绘图事件
        document.getElementById('save').addEventListener('click', this.saveDrawing.bind(this));
    }

    /**
     * 开始绘制
     * @param {MouseEvent} e - 鼠标事件对象
     */
    startDrawing(e) {
        this.isDrawing = true;
        [this.lastX, this.lastY] = this.getMousePos(e);
        this.saveState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 绘制过程
     * @param {MouseEvent} e - 鼠标事件对象
     */
    draw(e) {
        if (!this.isDrawing) return;

        const [x, y] = this.getMousePos(e);

        this.ctx.beginPath();
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (this.currentTool === 'pencil') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.brushSize;
            this.ctx.moveTo(this.lastX, this.lastY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        } else if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.brushSize;
            this.ctx.moveTo(this.lastX, this.lastY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        } else if (this.currentTool === 'rectangle' || this.currentTool === 'circle') {
            this.ctx.putImageData(this.saveState, 0, 0);
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.brushSize;
            
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

        [this.lastX, this.lastY] = [x, y];
    }

    /**
     * 停止绘制
     * 保存当前状态到撤销栈
     */
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            this.redoStack = [];
            this.updateUndoRedoButtons();
        }
    }

    /**
     * 获取鼠标在画布上的坐标
     * @param {MouseEvent} e - 鼠标事件对象
     * @returns {Array} - [x, y] 坐标数组
     */
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return [
            (e.clientX - rect.left) * scaleX,
            (e.clientY - rect.top) * scaleY
        ];
    }

    /**
     * 获取触摸点在画布上的坐标和压力值
     * @param {Touch} touch - 触摸事件对象
     * @returns {Array} - [x, y, pressure] 坐标和压力值数组
     */
    getTouchPos(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return [
            (touch.clientX - rect.left) * scaleX,
            (touch.clientY - rect.top) * scaleY,
            touch.force || 1.0  // 添加压力感应支持
        ];
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
     * 将画布内容保存为PNG图片
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
}

// 当页面加载完成时初始化应用
window.addEventListener('load', () => {
    new DrawingApp();
});
