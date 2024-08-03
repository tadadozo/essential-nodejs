export const ProcessArguments = class {
    constructor(argv){
        this._init(argv);
    }

    static create(argv){
        if (!argv){
            argv = process.argv;
        }
        return new ProcessArguments(argv);
    }

    _init(argv){
        this.argv = argv;
        this.nodePath = argv[0];
        this.scriptPath = argv[1];
        this.args = argv.splice(2);
        this.map = {};
        let key = "";
        this.args.forEach(p => {
            if (p.startsWith("-")){
                key = p.substring(1);
                this.map[key] = "true";
            }
            else {
                if (key){
                    this.map[key] = p;
                    key = "";
                }
            }
        });
    }

    getKeyValue(key){
        let value = this.map[key];
        return "undefined" !== typeof(value) ? value : null;
    }
    getArgument(key){
        if (this.args.length > key){
            return this.args[key];
        }
        return null;
    }
};