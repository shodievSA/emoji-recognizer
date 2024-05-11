function DCanvas(el)
{
    let canvas = document.getElementById("canvas");
    let context = canvas.getContext("2d");
    let pixel = 20;

    let isMouseDown = false;

    canvas.width = 500;
    canvas.height = 500;

    this.drawLine = (x1, y1, x2, y2, color = "gray") =>
    {
        context.beginPath();
        context.strokeStyle = color;
        context.lineJoin = "miter";
        context.lineWidth = 1;
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
    }

    this.drawCell = (x, y, w, h) => 
    {
        context.fillStyle = "blue";
        context.strokeStyle = "blue"; // ?
        context.lineJoin = "miter";
        context.lineWidth = 1;
        context.rect(x, y, w, h);
        context.fill();
    }

    this.clear = () =>
    {
        context.fillStyle = "white";
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    this.drawGrid = () =>
    {
        let w = canvas.width;
        let h = canvas.height;
        let p = w / pixel;

        let xStep = w / p;
        let yStep = h / p;

        for (let x = 0; x < w; x += xStep) // draws vertical lines
        {
            this.drawLine(x, 0, x, h);
        }

        for (let y = 0; y < h; y += yStep) // draws horizontal lines
        {
            this.drawLine(0, y, w, y);
        }
    }

    this.calculate = (draw = false) =>
    {
        let w = canvas.width;
        let h = canvas.height;
        let p = w / pixel;

        let xStep = w / p;
        let yStep = h / p;

        let vector = [];
        let __draw = [];

        for (let x = 0; x < w; x += xStep)
        {
            for (let y = 0; y < h; y += yStep)
            {
                let data = context.getImageData(x, y, xStep, yStep);
                let nonEmptyPixelCount = 0;

                for (let i = 0; i < data.data.length; i += 10)
                {
                    let isEmpty = (data.data[i] === 0);

                    if (!isEmpty)
                    {
                        nonEmptyPixelCount++;
                    }
                }

                if (nonEmptyPixelCount > 1 && draw)
                {
                    __draw.push([x, y, xStep, yStep]);
                }

                vector.push(nonEmptyPixelCount > 1 ? 1 : 0);
            }
        }

        if (draw)
        {
            this.clear();
            this.drawGrid();

            for (let _d in __draw)
            {
                this.drawCell(__draw[_d][0], __draw[_d][1], __draw[_d][2], __draw[_d][3]);
            }
        }

            return vector;
        }

        el.addEventListener("mousedown", (e) =>
        {
            isMouseDown = true;
            context.beginPath();
        });

        el.addEventListener("mouseup", (e) => 
        {
            isMouseDown = false;
        });

        el.addEventListener("mousemove", (e) => 
        {
            if (isMouseDown)
            {
                context.fillStyle = "red";
                context.strokeStyle = "red";
                context.lineWidth = pixel;

                context.lineTo(e.offsetX, e.offsetY);
                context.stroke();

                context.beginPath();
                context.arc(e.offsetX, e.offsetY, pixel / 2, 0, Math.PI * 2);
                context.fill();

                context.beginPath();
                context.moveTo(e.offsetX, e.offsetY);
            }
        });
}

const l_storage = localStorage;

let vector = [];
let net = null;
let train_data = [];

if (l_storage.getItem("trainingData") !== null)
{
    train_data = JSON.parse(l_storage.getItem("trainingData"));
}

const d = new DCanvas(document.getElementById("canvas"));

document.addEventListener("keypress", (e) => 
{
    if (e.key == "c")
    {
        d.clear();
    }   
    
    if (e.key == "v")
    {
        vector = d.calculate(true);

        if (confirm("Positive?"))
        {
            train_data.push({
                input: vector,
                output: { positive: 1 }
            })
        } 
        else
        {
            train_data.push({
                input: vector,
                output: { negative: 1 }
            })
        }

        l_storage.setItem("trainingData", JSON.stringify(train_data));
    }

    if (e.key == "b")
    {
        net = new brain.NeuralNetwork();
        net.train(train_data, { log: true });

        const result = brain.likely(d.calculate(), net);
        alert(result);
    }
});

