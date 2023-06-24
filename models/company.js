const mongoose = require('mongoose')

const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    cnpj: { type: String, required: true },
    addres: { type: String, required: true },
    city: { type: String },
    uf: { type: String },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }]

})

const Company = mongoose.model('Company', companySchema)

module.exports = Company