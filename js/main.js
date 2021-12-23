if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("serviceWorker.js")
    .then((reg) => {
      console.log("Service worker registered successfully", reg);
    })
    .catch((error) => {
      console.log(
        "An error occured while registering a service worker.",
        error
      );
    });
}

// class Student {

//   students = [];

//   constructor(
//     first_name,
//     last_name,
//     roll_number,
//     father_name,
//     mother_name,
//     phone_number,
//     dob,
//     password
//   ) {
//     this.first_name = first_name;
//     this.last_name = last_name;
//     this.roll_number = roll_number;
//     this.father_name = father_name;
//     this.mother_name = mother_name;
//     this.phone_number = phone_number;
//     this.dob = dob;
//     this.password = password;
//     this.usertype = "S";
//   }

//   static addStudent(student) {
//     students[student] = student;
//   }

//   static removeStudent(roll_number) {
//     console.log(removed);
//   }

//   static editStudent(roll_number) {
//     console.log("edited");
//   }
// }

// class Teacher {
//   constructor(username, name, email, password) {
//     this.username = username;
//     this.name = name;
//     this.password = password;
//     this.email = email;
//     this.usertype = "T";
//   }

//   static addTeacher(username, namem, email, password1, password2) {
//     console.log("Added teacher");
//   }
// }

// class Admin {
//   constructor(username, email, password) {
//     this.username = username;
//     this.email = email;
//     this.password = password;
//     this.usertype = "A";
//   }

//   addAdmin(username, email, password) {
//     console.log("Admin created");
//   }

//   removeAdmin(username) {
//     console.log("Admin removed");
//   }
// }

// const student = new Student('shin', 'chan', 'J8', 'harry', 'mitsy', 123456789, 23072000, 'naktelvadi');

// Student.addStudent(student);

// console.log(student);
