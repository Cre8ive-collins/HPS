const {Sequelize , DataTypes} = require('sequelize')
const config = require('../../config/config.json')
const mysql = require('mysql2/promise');
const { host, port, username, password, database, dialect } = config.development;


const db = new Sequelize({
    host, username, password, database, dialect
  })


const initialize = async ()  => {
    const connection = await mysql.createConnection({ 
        host, 
        port, 
        user: username, 
        password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    // connect to db
    // const sequelize = new Sequelize(database, username, password, { dialect: 'mysql' });

    // init models and add them to the exported db object
    // db.User = require('../users/user.model')(sequelize);

    // sync all models with database
    await db.sync();
}

const Users = db.define('user', {
  first_name: {
    type : DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type : DataTypes.STRING,
    allowNull: false
  },
  email : {
    type : DataTypes.STRING,
    allowNull : false,
    unique : true,
    isEmail: true,
  },
  other_name : DataTypes.STRING,
  passport_photo : DataTypes.STRING,
  international_passport : DataTypes.STRING,
  applications_status : DataTypes.INTEGER,
  phone : DataTypes.STRING,
  nationality : DataTypes.STRING,
  state : DataTypes.STRING,
  address : DataTypes.STRING,
  courses : DataTypes.STRING,
  program : DataTypes.STRING,
  marital_status : DataTypes.STRING,
  gender : DataTypes.STRING,
  place_of_birth : DataTypes.STRING,
  date_of_birth : DataTypes.DATE,
  agent_id : DataTypes.INTEGER,
  password : DataTypes.STRING,
  admission_officer : DataTypes.INTEGER,
  supporting_docs : DataTypes.STRING,

});

const Admission_officers = db.define('admission_officer', {
  first_name : DataTypes.STRING,
  last_name : DataTypes.STRING,
  email : {
    type : DataTypes.STRING,
    allowNull : false,
    unique : true,
    isEmail: true,
  },  
  clients : DataTypes.INTEGER,
  agents : DataTypes.INTEGER,
  role : DataTypes.INTEGER,
  pass : DataTypes.STRING,
  profile_picture : DataTypes.STRING,
  phone_number : DataTypes.STRING 
})

const Admin = db.define('admin', {
  first_name : DataTypes.STRING,
  last_name : DataTypes.STRING,
  email : {
    type : DataTypes.STRING,
    allowNull : false,
    unique : true,
    isEmail: true,
  },
  pass : DataTypes.STRING,
  role : DataTypes.INTEGER,
})




module.exports = {
  initialize,
  Users,
  Admission_officers,
  Admin,
}


