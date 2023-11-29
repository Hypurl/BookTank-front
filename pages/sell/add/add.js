const app = getApp()
Page({
  data: {
    currentTab: "School Books",
    categories: ["School Books", "Prep Books", "Other Books", "Other Items"],
    bookArray: [],
    bookIndexes: [0, 0, 0],
    exams: ["SAT", "SAT Subject Test", "ACT", "TOEFL", "AP Biology", "AP Calculus AB", "AP Calculus BC", "AP Chemistry", "AP Chinese Language and Culture", "AP Computer Science A", "AP Computer Science Principles", "AP English Language and Composition", "AP English Literature and Composition", "AP Environmental Science", "AP French Language and Culture", "AP Human Geography", "AP Macroeconomics", "AP Microeconomics", "AP Physics 1", "AP Physics 2", "AP Physics C", "AP Psychology", "AP Research", "AP Seminar", "AP Statistics", "AP Spanish Language and Culture", "AP United States History", "AP World History", "Other"],
    exam: 0,
    conditions: ["New", "Photocopied", "Very Good", "Good", "Fair", "Poor"],
    condition: 0,
    imageList: [],
    translate: app.globalData.translate
  },
  onLoad(event) {
    if (event.id) {
      let item = app.globalData.items[event.id]
      let imageList = []
      for (let image of item.images) {
        imageList.push(`${app.globalData.address}/static/compressed-images/${image}`)
      }
      let bookIndexes
      let grades = Object.keys(app.globalData.books)
      for (let a = 0; a < grades.length; a++) {
        let subjects = Object.keys(app.globalData.books[grades[a]])
        for (let b = 0; b < subjects.length; b++) {
          let books = app.globalData.books[grades[a]][subjects[b]]
          for (let c = 0; c < books.length; c++) {
            if (!bookIndexes && books[c] == item.name) {
              bookIndexes = [a, b, c]
            }
          }
        }
      }
      this.setData({
        edit: event.id,
        currentTab: item.category,
        bookIndexes: bookIndexes ? bookIndexes : [0, 0, 0],
        bookLabel: bookIndexes ? true : false,
        itemName: item.category != "School Books" ? item.name : "",
        exam: item.category == "Prep Books" ? this.data.exams.indexOf(item.subject) : 0,
        examLabel: item.category == "Prep Books",
        itemISBN: item.isbn,
        condition: this.data.conditions.indexOf(item.condition),
        conditionLabel: true,
        imageList: imageList
      })
    }
    this.updateBookArray()
  },
  selectCategory(event) {
    if (event.currentTarget.dataset.category == this.data.currentTab) {
      return
    }
    if (event.currentTarget.dataset.category == "Other Items") {
      if (this.data.conditions[this.data.condition] == "Photocopied") {
        this.setData({
          conditions: ["New", "Very Good", "Good", "Fair", "Poor"],
          condition: 0,
          conditionLabel: false
        })
      } else {
        this.setData({
          conditions: ["New", "Very Good", "Good", "Fair", "Poor"],
          condition: this.data.condition == 0 ? 0 : this.data.condition - 1
        })
      }
    } else if (this.data.currentTab == "Other Items") {
      this.setData({
        conditions: ["New", "Photocopied", "Very Good", "Good", "Fair", "Poor"],
        condition: 0,
        conditionLabel: false
      })
    }
    if (this.data.currentTab == "School Books") {
      this.setData({
        bookIndexes: [0, 0, 0],
        bookLabel: false,
        itemISBN: ""
      })
      this.updateBookArray()
    }
    this.setData({
      currentTab: event.currentTarget.dataset.category,
      invalidBook: false,
      invalidName: false,
      invalidExam: false,
      invalidISBN: false,
      invalidCondition: false,
      invalidPhotos: false
    })
  },
  fillISBN() {
    let grade = Object.keys(app.globalData.books)[this.data.bookIndexes[0]]
    let subject = Object.keys(app.globalData.books[grade])[this.data.bookIndexes[1]]
    this.setData({
      itemISBN: app.globalData.isbn[app.globalData.books[grade][subject][this.data.bookIndexes[2]]]
    })
  },
  showBookLabel() {
    this.setData({
      bookLabel: true
    })
    this.fillISBN()
  },
  updateBookArray() {
    let grade = Object.keys(app.globalData.books)[this.data.bookIndexes[0]]
    let subject = Object.keys(app.globalData.books[grade])[this.data.bookIndexes[1]]
    this.setData({
      bookArray: [
        Object.keys(app.globalData.books),
        Object.keys(app.globalData.books[grade]),
        app.globalData.books[grade][subject]
      ]
    })
  },
  changeBook(event) {
    if (event.detail.column == 0) {
      this.setData({
        bookIndexes: [
          event.detail.value,
          0,
          0
        ]
      })
      this.updateBookArray()
    } else if (event.detail.column == 1) {
      this.setData({
        bookIndexes: [
          this.data.bookIndexes[0],
          event.detail.value,
          0
        ]
      })
      this.updateBookArray()
    } else {
      this.setData({
        bookIndexes: [
          this.data.bookIndexes[0],
          this.data.bookIndexes[1],
          event.detail.value
        ]
      })
    }
    this.fillISBN()
  },
  changeExam(event) {
    this.setData({
      exam: event.detail.value,
      examLabel: true
    })
  },
  changeCondition(event) {
    this.setData({
      condition: event.detail.value,
      conditionLabel: true
    })
  },
  chooseImage() {
    wx.chooseImage({
      count: 4 - this.data.imageList.length,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: res => {
        this.setData({
          imageList: this.data.imageList.concat(res.tempFilePaths)
        })
      }
    })
  },
  viewImage(event) {
    let imageList = this.data.imageList.map(e => e.replace("compressed-images", "items"))
    wx.previewImage({
      urls: imageList,
      current: imageList[event.currentTarget.dataset.index]
    })
  },
  deleteImage(event) {
    this.setData({
      imageList: this.data.imageList.splice(event.currentTarget.dataset.index, 1)
    })
  },
  submit(event) {
    this.setData({
      invalidBook: this.data.currentTab == "School Books" && !this.data.bookLabel,
      invalidName: this.data.currentTab != "School Books" && event.detail.value["name"].length == 0,
      invalidExam: this.data.currentTab == "Prep Books" && !this.data.examLabel,
      invalidISBN: this.data.currentTab == "School Books" && event.detail.value["isbn"].length == 0,
      invalidCondition: !this.data.conditionLabel,
      invalidPhotos: this.data.imageList.length == 0
    })
    if (!this.data.invalidBook && !this.data.invalidName && !this.data.invalidExam && !this.data.invalidISBN && !this.data.invalidCondition && !this.data.invalidPhotos) {
      let uploadedImages = []
      let sendData = () => {
        if (uploadedImages.length == this.data.imageList.length) {
          wx.showLoading({
            title: `${this.data.imageList.length}/${this.data.imageList.length}`,
            mask: true
          })
          wx.request({
            method: "POST",
            url: app.globalData.address,
            data: {
              userID: app.globalData.userID,
              action: "addItem",
              edit: this.data.edit,
              category: this.data.currentTab,
              name: this.data.currentTab == "School Books" ? this.data.bookArray[2][this.data.bookIndexes[2]] : event.detail.value["name"],
              subject: this.data.currentTab == "Prep Books" ? this.data.exams[this.data.exam] : "",
              isbn: this.data.currentTab != "Other Items" ? event.detail.value["isbn"] : "",
              condition: this.data.conditions[this.data.condition],
              images: uploadedImages
            },
            success: res => {
              app.globalData.items = res.data.items
              wx.navigateBack()
            },
            complete: () => {
              wx.hideLoading()
            }
          })
        } else {
          let i = uploadedImages.length
          wx.showLoading({
            title: `${i}/${this.data.imageList.length}`,
            mask: true
          })
          if (this.data.imageList[i].indexOf(app.globalData.address) != -1) {
            uploadedImages.push(this.data.imageList[i].substring(this.data.imageList[i].lastIndexOf("/") + 1))
            sendData()
          } else {
            let fileName = new Date().getTime() + ".jpg"
            wx.uploadFile({
              url: app.globalData.address,
              filePath: this.data.imageList[i],
              name: fileName,
              formData: {
                directory: "items/"
              },
              success: () => {
                uploadedImages.push(fileName)
                sendData()
              },
              fail: () => {
                wx.hideLoading()
              }
            })
          }
        }
      }
      sendData()
    }
  }
})