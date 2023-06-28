const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = 8090;

const User = require('../models/user')
const Task = require('../models/task');
const Company = require('../models/company');
const Project = require('../models/project');

const mongoose = require('mongoose');

const SECRET = process.env.JWT_SECRET

const router = express.Router()

main().catch(err => { console.log(err) })

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://frontend-tm-nu.vercel.app/");
    res.header("Access-Control-Allow-Methods", 'GET,PUT,POST,DELETE');
    app.use(cors());
    next();
});

app.use('/api', router)

app.listen(port, () => {
    console.log(`Listening app on port ${port}`)
})


async function main() {
    await mongoose.connect(
        process.env.MONGODB_URL,
        { useNewUrlParser: true, useUnifiedTopology: true }
    )
        .then(() => {
            console.log('Conexão com MongoDB realizada com sucesso!');
        }).catch(() => {
            console.log('Erro: Conexão com MongoDB não foi realizada com sucesso!');
        })
}


router.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'PUT', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

router.use(cookieParser())

function createToken(user) {
    return jwt.sign({ id: user._id, company: user.company, email: user.email, name: user.name }, SECRET)
}

function readToken(token) {
    try {
        return jwt.verify(token, SECRET)
    } catch (error) {
        throw new Error('Token inválido')
    }
}

// Middleware de autenticação
function authenticate(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token inválido' });
    }
    try {
        const decodedToken = readToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
}

// Middleware de tratamento de erros
function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
}

// ------------------------ PROTECTED ROUTE ------------------------

router.get('/protected', authenticate, (req, res) => {
    res.json({ mensagem: 'Bem-vindo à página protegida!' });
});

// ------------------------ PROFILE ROUTE --------------------------

router.get("/profile", authenticate, async (req, res, next) => {
    try {
        const token = req.headers.authorization
        const decodedToken = readToken(token)
        const { id } = decodedToken
        if (!id) {
            res.status(404).json({
                error: true,
                message: "Usuário não encontrado"
            })
        }
        res.status(200).json(id)
    } catch (error) {
        next(error)
    }
})

// ----------------------- COMPANY ROUTE --------------------------

router.post('/company', async (req, res) => {
    try {
        const company = new Company(req.body);
        await company.save();
        res.status(201).json(company);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                error: true,
                message: "Companhia já cadastrada."
            });
        }
        res.status(500).json({ error: error.message });
    }
})

router.get("/company", async (req, res, next) => {
    try {
        const companys = await Company.find()
        res.json(companys);
    } catch {
        next(error)
    }
});

// --------------------------- USER ROUTE -----------------------------------

router.post('/user', async (req, res) => {
    try {
        const companyName = req.body.companyName;
        const company = await Company.findOne({ name: companyName });
        if (!company) {
            return res.status(400).json({
                error: true,
                message: "Empresa não encontrada.",
            });
        }
        const user = new User(req.body);
        user.company = String(company._id);
        const hashedPassword = await bcrypt.hash(user.password, 10);
        user.password = hashedPassword;
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                error: true,
                message: "Email já utilizado."
            });
        }
        res.status(500).json({ error: error.message });
    }
});

router.get("/user", async (req, res, next) => {
    try {
        const users = await User.find()
        res.json(users);
    } catch {
        next(error)
    }
});

router.get("/user/:id", async (req, res, next) => {
    try {
        const { params: { id } } = req;
        const user = await User.findById(id)
        if (!user) {
            res.status(404).json({
                error: true,
                message: "Usuário não encontrado"
            });
        }
        res.json(user)
    } catch (error) {
        next(error)
    }
})


router.put("/user/:id", async (req, res, next) => {
    try {
        const { params: { id }, body: updatedUser } = req;
        const user = await User.findByIdAndUpdate(id, updatedUser, { new: true });

        if (!user) {
            res.status(404).json({
                error: true,
                message: "Usuário não encontrado"
            });
        }
        res.status(200).json(user);
    } catch (error) {
        next(error)
    }
});

router.delete("/user/:id", async (req, res, next) => {
    try {
        const { params: { id } } = req;
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            res.status(404).json({
                error: true,
                message: "Usuário não encontrado"
            });
        };
        res.status(200).json({
            message: "Usuário deletado com sucesso"
        })
    } catch (error) {
        next(error)
    }
});

// ---------------------------- LOGIN ROUTE ---------------------------------------

router.post('/usersLogin', async (req, res, next) => {
    try {
        const { body: userLogin } = req;
        const company = await Company.findOne({ name: userLogin.companyName });
        if (!company) {
            return res.status(401).json({ message: 'Empresa inválida' });
        }

        const user = await User.findOne({ email: userLogin.email });

        if (!user) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        const isPasswordValid = await bcrypt.compare(userLogin.password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        if (String(company._id) !== String(user.company)) {
            return res.status(401).json({ message: 'Empresa inválida' });
        }

        const token = createToken(user);

        res.status(200)
            .cookie('authorization', token, {
                httpOnly: false,
                secure: true,
                sameSite: 'strict'
            })
            .json(token);
    } catch (error) {
        next(error);
    }
});

router.get('/usersLogin/:email', async (req, res, next) => {
    try {
        const { params: { email } } = req;
        const user = await User.findOne({ email: email });

        if (!user) {
            res.status(400).send("Email inválido");
        }
        res.status(200).json(user);
    } catch (error) {
        next(error)
    }
});

// ------------------------------- TASKS ROUTE --------------------------------

router.get("/tasks", authenticate, async (req, res, next) => {
    try {
        const { id, company } = req.user
        const { projectId } = req.query
        const tasks = await Task.find({
            "createdBy.user": id,
            "createdBy.company": company,
            project: projectId
        });
        res.status(200).json(tasks);
    } catch (error) {
        next(error);
    }
});

router.get("/allTasks", authenticate, async (req, res, next) => {
    try {
        const { id, company } = req.user
        const tasks = await Task.find({
            "createdBy.user": id,
            "createdBy.company": company,
        });
        res.status(200).json(tasks);
    } catch (error) {
        next(error);
    }
});

router.post('/tasks', authenticate, async (req, res, next) => {
    try {
        const { id, company } = req.user;
        if (!id) {
            return res.status(401).json({ message: 'Usuário inválido' });
        }

        if (!company) {
            return res.status(401).json({ message: 'Empresa inválida' });
        }

        const newTask = new Task({
            ...req.body,
            createdBy: { user: id, company: company }
        });

        const savedTask = await newTask.save();

        const { project } = req.body;
        if (project) {
            try {
                await Project.findByIdAndUpdate(
                    project,
                    { $push: { tasks: savedTask._id } },
                    { new: true }
                );
            } catch (error) {
                console.log(error)
            }
        }

        res.status(201).json(savedTask);
    } catch (error) {
        next(error);
    }
});

router.put("/tasks/:id", authenticate, async (req, res, next) => {
    try {
        const { params: { id }, body: updatedTask } = req;
        const task = await Task.findByIdAndUpdate(id, updatedTask, { new: true });

        if (!task) {
            res.status(404).json({
                error: true,
                message: "Task não encontrada"
            });
        }
        res.status(200).json(task);
    } catch (error) {
        next(error)
    }
});

router.delete("/tasks/:id", authenticate, async (req, res, next) => {
    try {
        const { params: { id } } = req;
        const task = await Task.findByIdAndDelete(id);

        if (!task) {
            return res.status(404).json({
                error: true,
                message: "Task não encontrada"
            });
        }

        res.status(200).json({
            message: "Task deletada com sucesso"
        });
    } catch (error) {
        next(error)
    }
});

router.get("/tasks/:id", authenticate, async (req, res, next) => {
    try {
        const { params: { id } } = req;
        const token = req.headers.authorization
        const decodedToken = readToken(token)
        const { company } = decodedToken
        const task = await Task.findOne({ _id: id, "createdBy.company": company })
        if (!task) {
            res.status(404).json({
                error: true,
                message: "Tarefa não encontrada"
            })
        }
        res.status(200).json(task)
    } catch (error) {
        next(error)
    }
})

// ------------------------------- PROJECTS ROUTE --------------------------------

router.get("/projects", authenticate, async (req, res, next) => {
    try {
        const { id, company } = req.user
        const projects = await Project.find({ "createdBy.user": id, "createdBy.company": company });
        res.status(200).json(projects);
    } catch (error) {
        next(error);
    }
});

router.post('/projects', authenticate, async (req, res, next) => {
    try {
        const { id, company } = req.user;
        if (!id) {
            return res.status(401).json({ message: 'Usuário inválido' });
        }

        if (!company) {
            return res.status(401).json({ message: 'Empresa inválida' });
        }

        const newProject = new Project({
            ...req.body,
            createdBy: { user: id, company: company }
        });

        const savedProject = await newProject.save();

        if (savedProject._id) {
            await Company.findByIdAndUpdate(
                company,
                { $push: { projects: savedProject._id } },
                { new: true }
            );
        }

        res.status(201).json(savedProject);
    } catch (error) {
        next(error);
    }
});

router.put("/projects/:id", authenticate, async (req, res, next) => {
    try {
        const { params: { id }, body: updatedProject } = req;
        const project = await Project.findByIdAndUpdate(id, updatedProject, { new: true });

        if (!project) {
            res.status(404).json({
                error: true,
                message: "Project não encontrada"
            });
        }
        res.status(200).json(project);
    } catch (error) {
        next(error)
    }
});

router.delete("/projects/:id", authenticate, async (req, res, next) => {
    try {
        const { params: { id } } = req;
        const project = await Project.findByIdAndDelete(id);

        if (!project) {
            return res.status(404).json({
                error: true,
                message: "Project não encontrada"
            });
        }

        res.status(200).json({
            message: "Project deletada com sucesso"
        });
    } catch (error) {
        next(error)
    }
});

router.get("/projects/:id", authenticate, async (req, res, next) => {
    try {
        const { params: { id } } = req;
        const { company } = req.user
        const project = await Project.findOne({ _id: id, "createdBy.company": company })
        if (!project) {
            return res.status(404).json({
                error: true,
                message: "Projeto não encontrado"
            })
        }
        res.status(200).json(project)
    } catch (error) {
        next(error)
    }
})

router.use(errorHandler)