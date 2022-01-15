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

if(document.getElementById("notification-button")){
  document.getElementById("notification-button").addEventListener('click',e => {
    showNotifications();
  })
}

const showNotifications = () => {
 const notifications = getNotificationsFromLocalStorage();
 const list = document.getElementById("notifications-list")
 while (list.firstChild) {
   list.firstChild.remove();
 }
 let nots = notifications.reverse()
 for(let i in nots){
   const li = document.createElement("li");

   li.innerHTML = `<div class="notification-styles">${nots[i].detail} <span class="notification-timestamp">${nots[i].timestamp}<span><div>`;
   list.appendChild(li);
 }
}

const getNotificationsFromLocalStorage = () => {
  const notifications = JSON.parse(localStorage.getItem("notifications"))
  if(notifications == null || notifications.length == 0){
    return []
  }
  return notifications;
}

const addNotificationToLocalStorage = (notifications) => {
  localStorage.setItem("notifications", JSON.stringify(notifications))
}

function getStudentInfo(admission_number){
  const postdata = {
    admission_number: admission_number,
  };
  const storage = localStorage;
  const tokens = JSON.parse(storage.getItem("jwt_tokens"));
  const localstudent = getStudentFromLocalStorage(admission_number);
  console.log("localst", localstudent);
  if (localstudent != null) {
    const pdata = localstudent.profile;
    const data = localstudent.user;

    return {
      student: {
        profile: pdata,
        user: data
      }
    }
  }
  else{
    if(window.navigator.onLine == false){
      alert("You are offline! requested data is unavailable in offline mode");
      return;
    }
    fetch("http://127.0.0.1:8000/app/getdetails/stup/", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: "JWT " + tokens.access,
      },
      body: JSON.stringify(postdata),
    }).then((resp) => {
      resp.json().then((data) => {
        if (data["detail"]) {
          alert(data["detail"]);
          return;
        }
        if (data == "Student not found") {
          alert("Student not found");
        }

        fetch("http://127.0.0.1:8000/app/getdetails/stuu/", {
          method: "POST",
          headers: {
            "Content-type": "application/json",
            Authorization: "JWT " + tokens.access,
          },
          body: JSON.stringify({ userid: data["user"] }),
        }).then((presp) => {
          presp.json().then((pdata) => {
            if (pdata.details) {
              console.log(pdata.details);
              alert(pdata.details);
              return;
            }

            let students_array = JSON.parse(
              localStorage.getItem("students")
            );
            if (students_array === null) {
              students_array = [];
            }
            console.log(students_array);
            const student = {
              profile: pdata,
              user : data
            }
            console.log(student);
            students_array.push(student);
            localStorage.setItem(
              "students",
              JSON.stringify(students_array)
            );
            return student;
          });
        });
      });
    });
  }
}

let syncToBePerformed = false;


var intervalID = setInterval(backgroundSync, 10000);

async function backgroundSync(){
  console.log("inside backsync")
  const marks_to_be_uploaded = JSON.parse(localStorage.getItem("marks_to_be_uploaded"));
  if(marks_to_be_uploaded != null && window.navigator.onLine){
    let marksList = [];
    for (let i in marks_to_be_uploaded){
      var student = getStudentInfo(marks_to_be_uploaded[i].student_id)
      let marks = {
        ...marks_to_be_uploaded[i],
        student_id: student.student.profile.id
      }
      console.log(marks)
      marksList.push(marks);
    }
    let response = {
      marks: marksList,
    };
    const tokens = getTokens();
    fetch("http://127.0.0.1:8000/app/postmarks/", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: "JWT " + tokens.access,
      },
      body: JSON.stringify(response),
    }).then((mresp) => {
      mresp.json().then((mdata) => {
        if (mdata == "saved!") {
          let not = {
            detail: "Marks saved!",
            timestamp: new Date().toLocaleString()
          }
          let notifications = getNotificationsFromLocalStorage();
          notifications.push(not);
          addNotificationToLocalStorage(notifications);
        } else {
          let not = {
            detail: "Student details already exist.",
            timestamp: new Date().toLocaleString(),
          };
          let notifications = getNotificationsFromLocalStorage();
          notifications.push(not);
          addNotificationToLocalStorage(notifications);
        }
      });
    });
    localStorage.removeItem('marks_to_be_uploaded');
  }

  const attendance_to_be_uploaded = JSON.parse(
    localStorage.getItem("attendance_to_be_uploaded")
  );
  if (attendance_to_be_uploaded != null && window.navigator.onLine) {
    let attendanceList = [];
    for (let i in attendance_to_be_uploaded) {
      student = getStudentInfo(attendance_to_be_uploaded[i].student_id);
      let attendance = {
        ...attendance_to_be_uploaded[i],
        student_id: student.student.profile.id,
      };
      console.log(attendance);
      attendanceList.push(attendance);
    }
    console.log(attendanceList);
    const tokens = getTokens();

    fetch("http://127.0.0.1:8000/app/postattendance/", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: "JWT " + tokens.access,
      },
      body: JSON.stringify(attendanceList),
    }).then((mresp) => {
      mresp.json().then((mdata) => {
        if (mdata == "saved!") {
          let not = {
            detail: "Attendance saved!",
            timestamp: new Date().toLocaleString(),
          };
          let notifications = getNotificationsFromLocalStorage();
          notifications.push(not);
          addNotificationToLocalStorage(notifications);
        } else {
          let not = {
            detail: "Attendance for this date already submitted",
            timestamp: new Date().toLocaleString(),
          };
          let notifications = getNotificationsFromLocalStorage();
          notifications.push(not);
          addNotificationToLocalStorage(notifications);
        }
      });
    });
    localStorage.removeItem("attendance_to_be_uploaded");
  }

  const students_to_register = JSON.parse(
    localStorage.getItem("students_to_register")
  );
  if (students_to_register != null && window.navigator.onLine) {
    for (let k in students_to_register) {
      const user = students_to_register[k].user;
      const tokens = getTokens();
      fetch("http://127.0.0.1:8000/auth/users/", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: "JWT " + tokens.access,
        },
        body: JSON.stringify(user),
      })
        .then((response) => {
          response.json().then((data) => {
            if (response.status == 400) {
              let errors = "";
              for (let i in data) {
                errors += data[i][0] + "\n";
              }
              let not = {
                detail: errors,
                timestamp: new Date().toLocaleString(),
              };
              let notifications = getNotificationsFromLocalStorage();
              notifications.push(not);
              addNotificationToLocalStorage(notifications);
              return;
            }

            let usercreated_response = data;
            const user_id = usercreated_response.id;

            const student = {
              admission_number:
                students_to_register[k].otherInfo.admission_number,
              father_name: students_to_register[k].otherInfo.father_name,
              mother_name: students_to_register[k].otherInfo.mother_name,
              address: students_to_register[k].otherInfo.address,
              phone: students_to_register[k].otherInfo.phone,
              birth_date: students_to_register[k].otherInfo.birth_date,
              class_year: students_to_register[k].otherInfo.class_year,
              div: students_to_register[k].otherInfo.div,
              user: user_id,
            };

            fetch("http://127.0.0.1:8000/students/", {
              method: "POST",
              headers: {
                "Content-type": "application/json",
                Authorization: "JWT " + tokens.access,
              },
              body: JSON.stringify(student),
            }).then((resp) => {
              resp
                .json()
                .then((respdata) => {
                  console.log(respdata);
                  if (respdata["detail"]) {
                    let not = {
                      detail: respdata["detail"],
                      timestamp: new Date().toLocaleString(),
                    };
                    let notifications = getNotificationsFromLocalStorage();
                    notifications.push(not);
                    addNotificationToLocalStorage(notifications);
                    return;
                  }
                  let not = {
                    detail: "Student Registered",
                    timestamp: new Date().toLocaleString(),
                  };
                  let notifications = getNotificationsFromLocalStorage();
                  notifications.push(not);
                  addNotificationToLocalStorage(notifications);
                })
                .catch(() => {
                  alert("ERROR OCCURED");
                });
            });
          });
        })
        .catch((e) => {
          console.log(e);
        });
    }
    localStorage.removeItem("students_to_register");
  }

  const offline_update_data = JSON.parse(
    localStorage.getItem("offline_update_data")
  );
  if (offline_update_data != null && window.navigator.onLine) {
    const user = offline_update_data.user;
    const student = offline_update_data.student;

    const tokens = getTokens();

    fetch("http://127.0.0.1:8000/app/uptdetails/stuu/", {
      method: "PUT",
      headers: {
        "Content-type": "application/json",
        Authorization: "JWT " + tokens.access,
      },
      body: JSON.stringify(user),
    })
      .then((response) => {
        response.json().then((data) => {
          usercreated_response = data;
          const user_id = usercreated_response.id;

          fetch("http://127.0.0.1:8000/app/uptdetails/stup/", {
            method: "PUT",
            headers: {
              "Content-type": "application/json",
              Authorization: "JWT " + tokens.access,
            },
            body: JSON.stringify(student),
          }).then((resp) => {
            resp.json().then((respdata) => {
              console.log(respdata);
              let not = {
                detail: "Student Updated",
                timestamp: new Date().toLocaleString()
              };
              let notifications = getNotificationsFromLocalStorage();
              notifications.push(not);
              addNotificationToLocalStorage(notifications);
            });
          });
        });
      })
      .catch((err) => {
        console.log(err);
      });
    localStorage.removeItem("offline_update_data");
  }
}

//Utility Functions

const getTokens = () => {
  return JSON.parse(localStorage.getItem("jwt_tokens"));
}

const getUser = () => {
  return JSON.parse(localStorage.getItem("user"));
}

const isLoggedIn = () => {
   if ((getUser() && getUser()["detail"] != null) || getTokens() === null){
     return false;
   }
  return true;
}

const getMarksFromLocalStorage = (subject, exam_name, admission_number) => {
  const marks = JSON.parse(localStorage.getItem("marks"));
  if(marks !=null && marks.length != 0){
    const resp = marks.filter((mark) => {
      if (
        mark.admission_number == admission_number
      ) {
        return true;
      }
      return false;
    });
    console.log(resp);
    return resp.length == 0 ? null: resp[0];
  }
  return null
}

const getAttendanceFromLocalStorage = (admission_number) => {
  const attendance = JSON.parse(localStorage.getItem("attendance"));
  if (attendance != null && attendance.length != 0) {
    const resp = attendance.filter((at) => {
      if (at.admission_number == admission_number) {
        return true;
      }
      return false;
    });
    console.log(resp);
    return resp.length == 0 ? null : resp[0];
  }
  return null;
};

const getStudentFromLocalStorage = (admission_number) => {
  const students = JSON.parse(localStorage.getItem("students"));
  if (students != null && students.length != 0) {
    const resp = students.filter((at) => {
      if (at.user.admission_number == admission_number) {
        return true;
      }
      return false;
    });
    return resp.length == 0 ? null : resp[0];
  }
  return null;
};

const getSectionStudentsFromLocalStorage = (classStudying, section) => {
  const admissionnumbers = JSON.parse(localStorage.getItem("sections"));
  if (admissionnumbers != null && admissionnumbers.length != 0) {
    let key = classStudying+'-'+section;
    return admissionnumbers[key];
  }
  return null;
};

// const refreshTokens = async () => {
//   const tokens = getTokens();
//   const response = await fetch("http://127.0.0.1:8000/auth/jwt/refresh/", {
//     method: "POST",
//     headers: {
//       "Content-type": "application/json",
//       Authorization: "JWT " + tokens.access,
//     },
//     body: JSON.stringify(tokens["refresh"]),
//   });
//   console.log(response);
// }

async function login() {
  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password").value;

  let data = {
    username: username,
    password: password,
  };

  const response = await fetch("http://127.0.0.1:8000/auth/jwt/create/", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const jwt_tokens = await response.json();
  const storage = localStorage;
  if(jwt_tokens['detail']){
    alert('Enter Valid Details')
  }
  else{
    const tokens = JSON.stringify(jwt_tokens);
    storage.setItem("jwt_tokens", tokens);
    window.location.href = "http://127.0.0.1:5502/home.html";
  }
  
}

// Handlign login of user
if (document.querySelector("#loginform")) {
  document.querySelector("#loginform").addEventListener("submit", (e) => {
    e.preventDefault();
    login();
  });
}

if (document.querySelector("#get-student-form")) {
  console.log(isLoggedIn())
  if(!isLoggedIn()){
    window.location.href = "http://127.0.0.1:5502/login.html";
  }
  document
    .querySelector("#get-student-form")
    .addEventListener("submit", (e) => {
      e.preventDefault();

      const classStudying = document.querySelector("#class").value;
      const section = document.querySelector("#section").value;
      console.log(classStudying, section)
      const storage = localStorage;
      const tokens = JSON.parse(storage.getItem("jwt_tokens"));

      const localSection = getSectionStudentsFromLocalStorage(
        classStudying,
        section
      );
      console.log("localSection", localSection);
      if (localSection != null) {
        console.log(localSection);
        if (document.getElementById("studentlist")) {
          const list = document.getElementById("studentlist");
          for (let i in localSection) {
            const row = document.createElement("tr");

            row.innerHTML = `
                      <td>${localSection[i]}</td>
                    `;
            list.appendChild(row);
          }
        } else if (document.getElementById("studentlist-marks")) {
          if (!isLoggedIn()) {
            window.location.href = "http://127.0.0.1:5502/login.html";
          }
          const list = document.getElementById("studentlist-marks");
          for (let i in localSection) {
            console.log(localSection[i]);

            const row = document.createElement("tr");

            row.innerHTML = `
                        <td>${localSection[i]}</td>
                        
                        <td><input id="total_marks,${localSection[i]}" type="text" name="${localSection[i]}" ></td>
                      `;

            list.appendChild(row);
          }
          document
            .querySelector("#submit-marks-form")
            .addEventListener("submit", (submitEvent) => {
              submitEvent.preventDefault();
              const exam_type = document.getElementById("exam_type").value;
              const subject_name =
                document.getElementById("subject_name").value;
              const max_marks = document.getElementById("max_marks").value;
              let marksList = [];
              for (let i in localSection) {
                let marks = {
                  student_id: localSection[i],
                  exam_name: exam_type,
                  subject_name: subject_name,
                  max_marks: max_marks,
                  total_marks: document.getElementById(
                    `total_marks,${localSection[i]}`
                  ).value,
                };
                marksList.push(marks);
              }
              let response = {
                marks: marksList,
              };
              let marksArray = JSON.parse(
                localStorage.getItem("marks_to_be_uploaded")
              );
              if (marksArray == null) {
                marksArray = [];
              }
              marksArray.push(...marksList);
              localStorage.setItem(
                "marks_to_be_uploaded",
                JSON.stringify(marksArray)
              );
              syncToBePerformed = true;
              alert("You are currently offline! Marks will be updated when network is established")
            });
        } else if (document.getElementById("studentlist-attendance")) {
          const list = document.getElementById("studentlist-attendance");
          for (let i in localSection) {
            console.log(localSection[i]);

            const row = document.createElement("tr");

            row.innerHTML = `
                        <td><label for="status-${localSection[i]}" ></label>${localSection[i]}</td>
                        <td><input type="checkbox" id="status-${localSection[i]}" name="${localSection[i]}" ></td>
                      `;

            list.appendChild(row);
          }
          document
            .querySelector("#submit-attendance-form")
            .addEventListener("submit", (attendanceSubmit) => {
              attendanceSubmit.preventDefault();
              const date = document.getElementById("date").value;
              let attendanceList = [];
              for (let i in localSection) {
                let attendance = {
                  date: date,
                  student_id: localSection[i],
                  status:
                    document.getElementById(
                      `status-${localSection[i]}`
                    ).checked == true
                      ? "P"
                      : "AB",
                };
                attendanceList.push(attendance);
              }
              console.log(attendanceList);
              let attendanceArray = JSON.parse(
                localStorage.getItem("attendance_to_be_uploaded")
              );
              if (attendanceArray == null) {
                attendanceArray = [];
              }
              attendanceArray.push(...attendanceList);
              localStorage.setItem(
                "attendance_to_be_uploaded",
                JSON.stringify(attendanceArray)
              );
              syncToBePerformed = true
              alert(
                "You are currently offline! Attendance will be updated when network is established"
              );
            });
        }
      }
      else{
        console.log(classStudying, section)
        fetch("http://127.0.0.1:8000/app/getdetails/", {
          method: "POST",
          headers: {
            "Content-type": "application/json",
            Authorization: "JWT " + tokens.access,
          },
          body: JSON.stringify({
            classStudying: classStudying,
            section: section,
          }),
        })
        .then(resp => {
          resp.json().then((respdata) => {
            console.log(respdata)
            if(respdata['detail']){
              alert(respdata["detail"]);
              return;
            }
            if (respdata.length == 0) {
              alert("No Details found");
            }

            let stuSectionArray = JSON.parse(localStorage.getItem("sections"));
            if (stuSectionArray === null) {
              stuSectionArray = [];
            }
            console.log(stuSectionArray);

            let array = [];
            for (var i in respdata){
              array.push(respdata[i].admission_number)
            }
            const sectionArray = {
              [classStudying+'-'+section]: array
            }
            
            localStorage.setItem("sections", JSON.stringify(sectionArray));
            if (document.getElementById("studentlist")) {
              const list = document.getElementById("studentlist");
              for (let i in respdata) {
                console.log(respdata[i].admission_number);

                const row = document.createElement("tr");

                row.innerHTML = `
                        <td>${respdata[i].admission_number}</td>
                      `;
                list.appendChild(row);
              }
            }
            else if (document.getElementById("studentlist-attendance")) {
              const list = document.getElementById("studentlist-attendance");
              for (let i in respdata) {
                console.log(respdata[i].admission_number);

                const row = document.createElement("tr");

                row.innerHTML = `
                        <td><label for="status-${respdata[i].admission_number}" ></label>${respdata[i].admission_number}</td>
                        <td><input type="checkbox" id="status-${respdata[i].admission_number}" name="${respdata[i].admission_number}" ></td>
                      `;

                list.appendChild(row);
              }
              document
                .querySelector("#submit-attendance-form")
                .addEventListener("submit", (attendanceSubmit) => {
                  attendanceSubmit.preventDefault();
                  const date = document.getElementById("date").value;
                  let attendanceList = [];
                  for (let i in respdata) {
                    let attendance = {
                      date: date,
                      student_id: respdata[i].user,
                      status:
                        document.getElementById(
                          `status-${respdata[i].admission_number}`
                        ).checked == true
                          ? "P"
                          : "AB",
                    };
                    attendanceList.push(attendance);
                  }
                  console.log(attendanceList);

                  fetch("http://127.0.0.1:8000/app/postattendance/", {
                    method: "POST",
                    headers: {
                      "Content-type": "application/json",
                      Authorization: "JWT " + tokens.access,
                    },
                    body: JSON.stringify(attendanceList),
                  }).then((mresp) => {
                    mresp.json().then((mdata) => {
                      if (mdata == "saved!") {
                        alert("Attendance Submitted!");
                      } else {
                        alert("Attendance already submitted! Check again.");
                      }
                    });
                  });
                });
            } else if (document.getElementById("studentlist-marks")) {
              if (!isLoggedIn()) {
                window.location.href = "http://127.0.0.1:5502/login.html";
              }
              const list = document.getElementById("studentlist-marks");
              for (let i in respdata) {
                console.log(respdata[i].admission_number);

                const row = document.createElement("tr");

                row.innerHTML = `
                        <td>${respdata[i].admission_number}</td>
                        
                        <td><input id="total_marks,${respdata[i].admission_number}" type="text" name="${respdata[i].admission_number}" ></td>
                      `;

                list.appendChild(row);
              }
              document
                .querySelector("#submit-marks-form")
                .addEventListener("submit", (submitEvent) => {
                  submitEvent.preventDefault();
                  const exam_type = document.getElementById("exam_type").value;
                  const subject_name = document.getElementById("subject_name").value;
                  const max_marks = document.getElementById("max_marks").value;
                  let marksList = [];
                  for (let i in respdata) {
                    let marks = {
                      student_id: respdata[i].user,
                      exam_name: exam_type,
                      subject_name: subject_name,
                      max_marks: max_marks,
                      total_marks: document.getElementById(
                        `total_marks,${respdata[i].admission_number}`
                      ).value,
                    };
                    marksList.push(marks);
                  }
                  let response = {
                    marks: marksList,
                  };
                  fetch("http://127.0.0.1:8000/app/postmarks/", {
                    method: "POST",
                    headers: {
                      "Content-type": "application/json",
                      Authorization: "JWT " + tokens.access,
                    },
                    body: JSON.stringify(response),
                  }).then((mresp) => {
                    mresp.json().then((mdata) => {
                      if (mdata == "saved!") {
                        alert("Marks Saved!");
                      } else {
                        alert("Make Sure Marks aren't already submitted!");
                      }
                    });
                  });
                });
            }
          });
        });
      }
    });
}

// Sumitting students marks

function submitMarks(studentList){
  console.log(studentList)
}

// handling logout
if (document.querySelector("#logout")) {
  const logout = document.getElementById("logout");
  if(!isLoggedIn()){
    logout.innerText = "Login";
    logout.setAttribute("href", "login.html");
  }
  else{
    logout.innerText = "Logout";
    logout.setAttribute("href", "/");
  }
  
  document.querySelector("#logout").addEventListener("click", () => {
    console.log('logging')
    const storage = localStorage;
    storage.clear();
    window.location.href = "http://127.0.0.1:5502/";
  });
}

// To handle username
if (document.querySelector("#username-text")) {
  let username = document.querySelector("#username-text");
  const storage = localStorage;
  if (isLoggedIn()) {
    getUserDetails();
    const user = JSON.parse(storage.getItem("user"));
    if(user == null){
      location.reload()
    }
    if(user.detail != null){
      window.location.href = "http://127.0.0.1:5502/login.html";
    }
    const p = document.createElement("p");
    const text = document.createTextNode(user.username);
    p.appendChild(text);
    username.appendChild(p);
  } else {
    console.log("NOT LOGGED IN");
    // Hide services tab
    const services = document.getElementById("services");
    services.remove();

    //add login instead of logout
    const logout = document.getElementById("logout");
    logout.innerText = "Login";
    logout.setAttribute("href", "login.html");

    // Adding the welcome p tag
    const p = document.createElement("p");
    const text = document.createTextNode("login to continue");
    p.appendChild(text);
    username.appendChild(p);
  }
}

async function getUserDetails() {
  if (!isLoggedIn()) {
    window.location.href = "http://127.0.0.1:5502/login.html";
  }
  const storage = localStorage;
  const tokens = JSON.parse(storage.getItem("jwt_tokens"));
  const response = await fetch("http://127.0.0.1:8000/auth/users/me/", {
    headers: {
      Authorization: "JWT " + tokens.access,
    },
  });
  const data = await response.json();
  const user = JSON.stringify(data);
  storage.setItem("user", user);

  if (JSON.parse(user).user_type == "S") {
    const section = document.getElementById("services-teacher");
    section.remove();
    const usertype_response = await fetch(
      "http://127.0.0.1:8000/students/me/",
      {
        headers: {
          Authorization: "JWT " + tokens.access,
        },
      }
    );
    const usertype_data = await usertype_response.json();
    storage.setItem("user_type", JSON.stringify(usertype_data));

  } else if (JSON.parse(user).user_type == "T") {
    const section = document.getElementById("services-student");
    section.remove();
    const usertype_response = await fetch(
      "http://127.0.0.1:8000/teachers/me/",
      {
        headers: {
          Authorization: "JWT " + tokens.access,
        },
      }
    );

    const usertype_data = await usertype_response.json();
    storage.setItem("user_type", JSON.stringify(usertype_data));
  }
}

if (document.querySelector("#profile")) {
  if (!isLoggedIn()) {
    window.location.href = "http://127.0.0.1:5502/login.html";
  }
  const storage = localStorage;
  const user = JSON.parse(storage.getItem("user"));
  const user_type = JSON.parse(storage.getItem("user_type"));
  const user_keys = Object.keys(user);
  const usertype_keys = Object.keys(user_type);
  const list = document.querySelector("#profile-details");

  for (let i in user_keys) {
    const row = document.createElement("tr");
    if (user_keys[i] === "user_type" || user_keys[i] === "id") {
      continue;
    }
    row.innerHTML = `
        <td>${user_keys[i]}</td>
        <td><input style="margin-left: 1rem;" value='${
          user[user_keys[i]]
        }' readonly></td>
      `;

    list.appendChild(row);
  }
  for (let i in usertype_keys) {
    const row = document.createElement("tr");
    let type = "text";
    if (usertype_keys[i] === "user") {
      continue;
    }
    if (usertype_keys[i] == "birth_date") {
      type = "date";
    }
    row.innerHTML = `
        <td>${usertype_keys[i]}</td>
        <td><input style="margin-left: 1rem;" type='${type}' value='${
      user_type[usertype_keys[i]]
    }' readonly></td>
      `;

    list.appendChild(row);
  }
}

if (document.querySelector("#registration-form") != null) {
  if (!isLoggedIn()) {
    window.location.href = "http://127.0.0.1:5502/login.html";
  }
  document
    .querySelector("#registration-form")
    .addEventListener("submit", (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const first_name = document.getElementById("first_name").value;
      const last_name = document.getElementById("last_name").value;
      const user_type = document.getElementById("user_type").value;
      const password1 = document.getElementById("password1").value;
      const password2 = document.getElementById("password2").value;
      const admission_number =
        document.getElementById("admission_number").value;
      const father_name = document.getElementById("father_name").value;
      const mother_name = document.getElementById("mother_name").value;
      const address = document.getElementById("address").value;
      const phone = document.getElementById("phone").value;
      const birth_date = document.getElementById("birth_date").value;
      const class_year = document.getElementById("class_year").value;
      const div = document.getElementById("div").value;

      const user = {
        username: username,
        email: email,
        first_name: first_name,
        last_name: last_name,
        password: password1,
        user_type: user_type,
      };
      const storage = localStorage;
      const tokens = JSON.parse(storage.getItem('jwt_tokens'));
      if(window.navigator.onLine == false){
        const otherInfo = {
          admission_number: admission_number,
          father_name: father_name,
          mother_name: mother_name,
          address: address,
          phone: phone,
          birth_date: birth_date,
          class_year: class_year,
          div: div,
        };
        const userData = {
          user: user,
          otherInfo: otherInfo
        }
        console.log('window offline storing data offline')
        let studentToRegisterArray = JSON.parse(storage.getItem("students_to_register"));
        if(studentToRegisterArray == null){
          studentToRegisterArray = []
        }
        studentToRegisterArray.push(userData);
        storage.setItem(
          "students_to_register",
          JSON.stringify(studentToRegisterArray)
        );
        syncToBePerformed = true;
        alert("You are offline, data will be saved when network is established.")
        return;
      }
      fetch("http://127.0.0.1:8000/auth/users/", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: "JWT " + tokens.access,
        },
        body: JSON.stringify(user),
      })
        .then((response) => {
          response.json().then((data) => {

            if(response.status == 400){
              let errors = ""
              for (let i in data) {
                errors += data[i][0] + "\n"
              }
              alert(errors);
              return
            }
            
            let usercreated_response = data;
            const user_id = usercreated_response.id;

            const student = {
              admission_number: admission_number,
              father_name: father_name,
              mother_name: mother_name,
              address: address,
              phone: phone,
              birth_date: birth_date,
              class_year: class_year,
              div: div,
              user: user_id,
            };

            fetch("http://127.0.0.1:8000/students/", {
              method: "POST",
              headers: {
                "Content-type": "application/json",
                Authorization: "JWT " + tokens.access,
              },
              body: JSON.stringify(student),
            }).then((resp) => {
              resp.json().then((respdata) => {
                console.log(respdata)
                if (respdata["detail"]) {
                  alert(respdata["detail"]);
                  return;
                }
                if (!alert("Student created!")) {
                  window.location.reload();
                }
              }).catch(() => {
                alert("ERROR OCCURED")
              });
            });
          });
        })
        .catch((e) => {
          console.log(e);
        });
    });
}

if (document.querySelector("#get-student-info")) {
  if (!isLoggedIn()) {
    window.location.href = "http://127.0.0.1:5502/login.html";
  }
  document
    .querySelector("#get-student-info")
    .addEventListener("submit", (e) => {
      e.preventDefault();
      const admission_number = document.getElementById(
        "student-roll-number"
      ).value;
      const postdata = {
        admission_number: admission_number,
      };
      const storage = localStorage;
      const tokens = JSON.parse(storage.getItem("jwt_tokens"));
      const localstudent = getStudentFromLocalStorage(admission_number);
      console.log("localst", localstudent);
      if (localstudent != null) {
        const pdata = localstudent.profile;
        const data = localstudent.user;

        console.log(localstudent)

        const userid = document.getElementById("userid");
        userid.value = pdata.id;
        const username = document.getElementById("username");
        username.value = pdata.username;
        const email = document.getElementById("email");
        email.value = pdata.email;
        const first_name = document.getElementById("first_name");
        first_name.value = pdata.first_name;
        const last_name = document.getElementById("last_name");
        last_name.value = pdata.last_name;
        const admission_number = document.getElementById("admission_number");
        admission_number.value = data.admission_number;
        const father_name = document.getElementById("father_name");
        father_name.value = data.father_name;
        const mother_name = document.getElementById("mother_name");
        mother_name.value = data.mother_name;
        const address = document.getElementById("address");
        address.value = data.address;
        const phone = document.getElementById("phone");
        phone.value = data.phone;
        const birth_date = document.getElementById("birth_date");
        birth_date.value = data.birth_date;
        const class_year = document.getElementById("class_year");
        class_year.value = data.class_year;
        const div = document.getElementById("div");
        div.value = data.div;
        
      }
      else{
        if(window.navigator.onLine == false){
          alert("You are offline! requested data is unavailable in offline mode");
          return;
        }
        fetch("http://127.0.0.1:8000/app/getdetails/stup/", {
          method: "POST",
          headers: {
            "Content-type": "application/json",
            Authorization: "JWT " + tokens.access,
          },
          body: JSON.stringify(postdata),
        }).then((resp) => {
          resp.json().then((data) => {
            if (data["detail"]) {
              alert(data["detail"]);
              return;
            }
            if (data == "Student not found") {
              alert("Student not found");
            }

            fetch("http://127.0.0.1:8000/app/getdetails/stuu/", {
              method: "POST",
              headers: {
                "Content-type": "application/json",
                Authorization: "JWT " + tokens.access,
              },
              body: JSON.stringify({ userid: data["user"] }),
            }).then((presp) => {
              presp.json().then((pdata) => {
                if (pdata.details) {
                  console.log(pdata.details);
                  alert(pdata.details);
                  return;
                }

                let students_array = JSON.parse(
                  localStorage.getItem("students")
                );
                if (students_array === null) {
                  students_array = [];
                }
                console.log(students_array);
                const student = {
                  profile: pdata,
                  user : data
                }
                console.log(student);
                students_array.push(student);
                localStorage.setItem(
                  "students",
                  JSON.stringify(students_array)
                );

                const userid = document.getElementById("userid");
                userid.value = pdata.id;
                const username = document.getElementById("username");
                username.value = pdata.username;
                const email = document.getElementById("email");
                email.value = pdata.email;
                const first_name = document.getElementById("first_name");
                first_name.value = pdata.first_name;
                const last_name = document.getElementById("last_name");
                last_name.value = pdata.last_name;
                const admission_number =
                  document.getElementById("admission_number");
                admission_number.value = data.admission_number;
                const father_name = document.getElementById("father_name");
                father_name.value = data.father_name;
                const mother_name = document.getElementById("mother_name");
                mother_name.value = data.mother_name;
                const address = document.getElementById("address");
                address.value = data.address;
                const phone = document.getElementById("phone");
                phone.value = data.phone;
                const birth_date = document.getElementById("birth_date");
                birth_date.value = data.birth_date;
                const class_year = document.getElementById("class_year");
                class_year.value = data.class_year;
                const div = document.getElementById("div");
                div.value = data.div;
              });
            });
          });
        });
      }
    });
  document.querySelector("#update-form").addEventListener("submit", (e) => {
    e.preventDefault();
    
    const userid = document.getElementById("userid").value;
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const first_name = document.getElementById("first_name").value;
    const last_name = document.getElementById("last_name").value;
    const user_type = document.getElementById("user_type").value;
    const admission_number = document.getElementById("admission_number").value;
    const father_name = document.getElementById("father_name").value;
    const mother_name = document.getElementById("mother_name").value;
    const address = document.getElementById("address").value;
    const phone = document.getElementById("phone").value;
    const birth_date = document.getElementById("birth_date").value;
    const class_year = document.getElementById("class_year").value;
    const div = document.getElementById("div").value;

    const user = {
      id: userid,
      username: username,
      email: email,
      first_name: first_name,
      last_name: last_name,
      user_type: user_type,
    };
    const storage = localStorage;
    const tokens = JSON.parse(storage.getItem("jwt_tokens"));


    if (window.navigator.onLine == true) {
      fetch("http://127.0.0.1:8000/app/uptdetails/stuu/", {
        method: "PUT",
        headers: {
          "Content-type": "application/json",
          Authorization: "JWT " + tokens.access,
        },
        body: JSON.stringify(user),
      })
        .then((response) => {
          response.json().then((data) => {
            usercreated_response = data;
            const user_id = usercreated_response.id;

            const student = {
              admission_number: admission_number,
              father_name: father_name,
              mother_name: mother_name,
              address: address,
              phone: phone,
              birth_date: birth_date,
              class_year: class_year,
              div: div,
              user: user_id,
            };

            fetch("http://127.0.0.1:8000/app/uptdetails/stup/", {
              method: "PUT",
              headers: {
                "Content-type": "application/json",
                Authorization: "JWT " + tokens.access,
              },
              body: JSON.stringify(student),
            }).then((resp) => {
              resp.json().then((respdata) => {
                console.log(respdata);
                if (!alert("Student updated!")) {
                  window.location.reload();
                }
              });
            });
          });
        })
        .catch((err) => {
          console.log(err);
        });
    }
    else{
      const student = {
        admission_number: admission_number,
        father_name: father_name,
        mother_name: mother_name,
        address: address,
        phone: phone,
        birth_date: birth_date,
        class_year: class_year,
        div: div,
        user: userid,
      };
      const info = {
        user: user,
        student: student
      }
      localStorage.setItem("offline_update_data", JSON.stringify(info));
      syncToBePerformed = true;
    }

    alert("Data saved. User will be updated when network is established")
    
  });
}

// student attendance
if (document.querySelector("#get-student-attendance")) {
  if (!isLoggedIn()) {
    window.location.href = "http://127.0.0.1:5502/login.html";
  }
  document
    .querySelector("#get-student-attendance")
    .addEventListener("submit", (e) => {
      e.preventDefault();
      const admission_number = document.getElementById(
        "student-roll-number"
      ).value;
      const storage = localStorage;
      const tokens = JSON.parse(storage.getItem("jwt_tokens"));
      const localattendance = getAttendanceFromLocalStorage(
        admission_number
      );
      console.log("localat", localattendance);
      if (localattendance != null) {
        console.log(localattendance);
        const present = localattendance.present;
        const absent = localattendance.absent;
        const total = present + absent;
        const percent = (present / total) * 100;
        document.getElementById("present").innerText = present;
        document.getElementById("absent").innerText = absent;
        document.getElementById("percent").innerText = percent + "%";
      }
      else{
        fetch("http://127.0.0.1:8000/app/getattendance/", {
          method: "POST",
          headers: {
            "Content-type": "application/json",
            Authorization: "JWT " + tokens.access,
          },
          body: JSON.stringify({ admission_number: admission_number }),
        }).then((resp) => {
          resp.json().then((data) => {

            let attendance_array = JSON.parse(localStorage.getItem("attendance"));
            if (attendance_array === null) {
              attendance_array = [];
            }
            console.log(attendance_array);
            data = {
              ...data,
              admission_number:admission_number
            }
            console.log(data)
            attendance_array.push(data);
            localStorage.setItem("attendance", JSON.stringify(attendance_array));

            const present = data.present;
            const absent = data.absent;
            const total = present + absent;
            const percent = (present / total) * 100;
            document.getElementById("present").innerText = present;
            document.getElementById("absent").innerText = absent;
            document.getElementById("percent").innerText = percent + "%";
          });
        });
      }
    });
}

if (document.querySelector("#get-exam-results")) {
  if (!isLoggedIn()) {
    window.location.href = "http://127.0.0.1:5502/login.html";
  }
  document
    .querySelector("#get-exam-results")
    .addEventListener("submit", (e) => {
      e.preventDefault();

      const subject = document.getElementById("subject").value;
      const exam_type = document.getElementById("exam_type").value;
      const admission_number = document.getElementById(
        "student-roll-number"
      ).value;
      const storage = localStorage;
      const tokens = JSON.parse(storage.getItem("jwt_tokens"));
      const localmarks = getMarksFromLocalStorage(
        subject,
        exam_type,
        admission_number
      );
      console.log("localmarks", localmarks)
      if(localmarks!=null){
        console.log(localmarks);
        const list = document.querySelector("#studentlist-marks");
        const row = document.createElement("tr");
        row.innerHTML = `
              <td>${localmarks.admission_number}</td>
              <td>${localmarks.subject}</td>
              <td>${localmarks.total_marks}</td>
              <td>${localmarks.max_marks}</td>
            `;
        list.appendChild(row);
      }
      else{
        fetch("http://127.0.0.1:8000/app/getmarks/", {
          method: "POST",
          headers: {
            "Content-type": "application/json",
            Authorization: "JWT " + tokens.access,
          },
          body: JSON.stringify({
            subject: subject,
            exam_type: exam_type,
            admission_number: admission_number,
          }),
        }).then((resp) => {
          resp.json().then((data) => {
            let marks_array = JSON.parse(localStorage.getItem("marks"));
            if(marks_array === null){
              marks_array = [];
            }
            console.log(marks_array);
            marks_array.push(data);
            localStorage.setItem("marks", JSON.stringify(marks_array));
            const list = document.querySelector("#studentlist-marks");
            if (data.admission_number == null) {
              for (let i in data) {
                const row = document.createElement("tr");
                row.innerHTML = `
                      <td>${data[i].admission_number}</td>
                      <td>${data[i].subject}</td>
                      <td>${data[i].total_marks}</td>
                      <td>${data[i].max_marks}</td>
                      
                    `;

                list.appendChild(row);
              }
            } else {
              const row = document.createElement("tr");
              row.innerHTML = `
                      <td>${data.admission_number}</td>
                      <td>${data.subject}</td>
                      <td>${data.total_marks}</td>
                      <td>${data.max_marks}</td>
                    `;
              list.appendChild(row);
            }
          });
        });
      }
    });
}

