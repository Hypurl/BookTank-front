App({
  onLaunch() {
    let login = () => {
      wx.login({
        success: res => {
          wx.request({
            method: "POST",
            url: this.globalData.address,
            data: {
              action: "login",
              code: res.code
            },
            success: res => {
              this.globalData.userID = res.data.userID
              wx.setStorage({
                key: "ID",
                data: res.data.userID
              })
              connect()
              getData()
            },
            fail: () => {
              login()
            }
          })
        },
        fail: () => {
          login()
        }
      })
    }

    let active = true
    let connected = false
    let connect = () => {
      wx.onSocketOpen(() => {
        connected = true
        wx.sendSocketMessage({
          data: JSON.stringify({
            action: "connect",
            userID: this.globalData.userID
          })
        })
        wx.onAppHide(() => {
          active = false
        })
        wx.onAppShow(() => {
          active = true
          if (!connected) {
            reconnect()
          }
        })
      })
      wx.onSocketError(() => {
        wx.closeSocket()
      })
      wx.onSocketClose(() => {
        connected = false
        if (active) {
          reconnect()
        }
      })
      wx.connectSocket({
        url: "ws" + this.globalData.address.substring(4)
      })
    }
    let reconnect = () => {
      setTimeout(() => {
        wx.connectSocket({
          url: "ws" + this.globalData.address.substring(4)
        })
      }, 1000)
    }

    let getData = () => {
      wx.request({
        method: "POST",
        url: this.globalData.address,
        data: {
          userID: this.globalData.userID,
          action: "getData"
        },
        success: res => {
          this.globalData.users = res.data.users
          this.globalData.products = res.data.products
          this.globalData.items = res.data.items
          this.globalData.messages = res.data.messages
          this.globalData.bookmarks = res.data.bookmarks
          this.globalData.reservations = res.data.reservations
        },
        fail: () => {
          getData()
        }
      })
    }

    wx.getStorage({
      key: "ID",
      success: res => {
        this.globalData.userID = res.data
        connect()
        getData()
        if (res.data == 1) {
          wx.clearStorage()
        }
      },
      fail: () => {
        login()
      }
    })

    wx.getSystemInfo({
      success: res => {
        this.globalData.StatusBar = res.statusBarHeight
        try {
          let capsule = wx.getMenuButtonBoundingClientRect()
          if (capsule.bottom == 0 && capsule.height == 0 && capsule.left == 0 && capsule.right == 0 && capsule.top == 0 && capsule.width == 0) {
            throw true
          }
          this.globalData.CustomBar = capsule.bottom + capsule.top - res.statusBarHeight
        } catch (error) {
          this.globalData.CustomBar = res.statusBarHeight + 45
        }
        if (res.model.toLowerCase().includes("ipad")) {
          this.globalData.CustomBar += 50
        }

        this.globalData.DevTools = res.platform == "devtools"
        this.globalData.Chinese = res.language.includes("zh_")
        this.updateLanguage()
      }
    })
  },
  appendMessage(message) {
    message = JSON.parse(message.data)
    let key
    if (message.sender == this.globalData.userID) {
      key = message.receiver
    } else {
      key = message.sender
    }
    if (!this.globalData.messages[key]) {
      this.globalData.messages[key] = []
    }
    this.globalData.messages[key].push(
      [message.sender, message.message, message.messageType, message.date, false, message.messageID]
    )
  },
  countNewMessages(contactID) {
    let newMessages = 0
    let messages = this.globalData.messages[contactID]
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i][0] == this.globalData.userID || messages[i][4]) {
        break
      }
      newMessages++
    }
    return newMessages
  },
  getDate(date) {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear() % 100}`
  },
  getTime(date) {
    let hours = date.getHours()
    let minutes = date.getMinutes()
    let ampm = hours >= 12 ? "PM" : "AM"
    hours %= 12
    hours = hours ? hours : 12
    minutes = minutes < 10 ? `0${minutes}` : minutes
    return `${hours}:${minutes} ${ampm}`
  },
  copy(text) {
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: "Copied"
        })
      }
    })
  },
  readMessage(contactID) {
    let messages = this.globalData.messages[contactID]
    let lastMessage = messages.slice(-1)[0]
    if (lastMessage[0] == contactID) {
      wx.sendSocketMessage({
        data: JSON.stringify({
          action: "readMessage",
          messageID: lastMessage[5]
        }),
        success: () => {
          this.globalData.messages[contactID][messages.length - 1][4] = true
        }
      })
    }
  },
  updateLanguage() {
    if (this.globalData.Chinese) {
      this.globalData.translate = {
        "ENTER": "进入",
        "BROWSE": "浏览",
        "SELL": "卖",
        "BUY": "买",
        "CHATS": "讯息",
        "Search": "搜索",
        "Reserved": "已预订",
        "Selling": "卖当中",
        "My Items": "我的物品",
        "View All": "查看全部",
        "SELL TOGETHER": "一起卖",
        "Name": "名字",
        "Price": "价格",
        "Additional Information": "额外信息",
        "SUBMIT": "提交",
        "Reserving": "预订中",
        "Bookmarks": "书签",
        "VIEW": "查看",
        "REMOVE": "删除",
        "Password": "密码",
        "Items": "物品",
        "Category": "类别",
        "Exam": "考试",
        "Subject": "科目",
        "Condition": "状况",
        "RESERVE": "预订",
        "School Books": "教科书",
        "Prep Books": "备考书",
        "Other Books": "其他书",
        "Other Items": "其他物品",
        "New": "新",
        "Photocopied": "影印版",
        "Very Good": "非常好",
        "Good": "好",
        "Fair": "普通",
        "Poor": "差",
        "ADD ITEM": "添加物品",
        "EDIT ITEM": "改物品",
        "Book": "书",
        "Photos": "相片",
        "Front Cover, Back Cover, ISBN": "封面，背面，ISBN",
        "SEND": "发送",
        " reserved ": "预订了",
        "'s": "的",
        " cancelled the reservation for ": "取消预订",
        "Identity": "身份",
        "WeChat ID": "微信号",
        "MESSAGE": "发讯息",
        "Student": "学生",
        "Parent": "家长",
        "Teacher": "老师",
        "Other": "其他",
        "NEW": "新",
        "Item": "物品",
        "Canceled": "已取消",
        "First Name": "姓",
        "Last Name": "名",
        "REGISTER": "注册",
        "CONFIRM": "确认",
        "CANCEL": "取消",
        "EDIT NAME & PRICE": "改名字和价格",
        "EDIT PRICE": "改价格",
        "MOVE TO MY ITEMS": "移到我的物品",
        "DELETE COMPLETELY": "完全删除",
        "CONTACT BUYER": "联系买家",
        "CONTACT SELLER": "联系卖家",
        "CANCEL RESERVATION": "取消预订",
        "Date Posted": "发布日期",
        "Accept": "同意",
        "User Services Agreement": "用户服务协议",
        "Privacy Policy": "隐私政策"
      }
    } else {
      this.globalData.translate = {
        "ENTER": "ENTER",
        "BROWSE": "BROWSE",
        "SELL": "SELL",
        "BUY": "BUY",
        "CHATS": "CHATS",
        "Search": "Search",
        "Reserved": "Reserved",
        "Selling": "Selling",
        "My Items": "My Items",
        "View All": "View All",
        "SELL TOGETHER": "SELL TOGETHER",
        "Name": "Name",
        "Price": "Price",
        "Additional Information": "Additional Information",
        "SUBMIT": "SUBMIT",
        "Reserving": "Reserving",
        "Bookmarks": "Bookmarks",
        "VIEW": "VIEW",
        "REMOVE": "REMOVE",
        "Password": "Password",
        "Items": "Items",
        "Category": "Category",
        "Exam": "Exam",
        "Subject": "Subject",
        "Condition": "Condition",
        "RESERVE": "RESERVE",
        "School Books": "School Books",
        "Prep Books": "Prep Books",
        "Other Books": "Other Books",
        "Other Items": "Other Items",
        "New": "New",
        "Photocopied": "Photocopied",
        "Very Good": "Very Good",
        "Good": "Good",
        "Fair": "Fair",
        "Poor": "Poor",
        "ADD ITEM": "ADD ITEM",
        "EDIT ITEM": "EDIT ITEM",
        "Book": "Book",
        "Photos": "Photos",
        "Front Cover, Back Cover, ISBN": "Front Cover, Back Cover, ISBN",
        "SEND": "SEND",
        " reserved ": " reserved ",
        "'s": "'s",
        " cancelled the reservation for ": " cancelled the reservation for ",
        "Identity": "Identity",
        "WeChat ID": "WeChat ID",
        "MESSAGE": "MESSAGE",
        "Student": "Student",
        "Parent": "Parent",
        "Teacher": "Teacher",
        "Other": "Other",
        "NEW": "NEW",
        "Item": "Item",
        "Canceled": "Canceled",
        "First Name": "First Name",
        "Last Name": "Last Name",
        "REGISTER": "REGISTER",
        "CONFIRM": "CONFIRM",
        "CANCEL": "CANCEL",
        "EDIT NAME & PRICE": "EDIT NAME & PRICE",
        "EDIT PRICE": "EDIT PRICE",
        "MOVE TO MY ITEMS": "MOVE TO MY ITEMS",
        "DELETE COMPLETELY": "DELETE COMPLETELY",
        "CONTACT BUYER": "CONTACT BUYER",
        "CONTACT SELLER": "CONTACT SELLER",
        "CANCEL RESERVATION": "CANCEL RESERVATION",
        "Date Posted": "Date Posted",
        "Accept": "Accept",
        "User Services Agreement": "User Services Agreement",
        "Privacy Policy": "Privacy Policy"
      }
    }
  },
  globalData: {
    address: "https://tankofbooks.com",
    books: {
      "6th": {
        "English": [
          "Bud, Not Buddy",
          "Esperanza Rising",
          "Freak The Mighty",
          "Kira-Kira",
          "Everything you need to ACE English Language Arts in one big fat notebook"
        ],
        "Science": [
          "Integrated iScience, Course 1, Student Edition (INTEGRATED SCIENCE) 1st Edition"
        ],
        "History": [
          "Kampung Boy"
        ]
      },
      "7th": {
        "English": [
          "The Giver by Lois Lowry",
          "The Outsiders",
          "A Night Divided by Jennifer A. Nielson",
          "Stargirl by Jerry Spinelli",
          "Everything you need to ACE English Language Arts in one big fat notebook"
        ],
        "Science": [
          "Integrated iScience, Course 2, Student Edition"
        ],
        "History": [
          "World Geography - Western"
        ]
      },
      "8th": {
        "Math": [
          "Course 3 Mathematics (Common Core)",
          "Algebra 1 Common Core",
          "The Art of Problem Solving - Introduction to Algebra"
        ],
        "English": [
          "The Hunger Games: Book 1",
          "Everything you need to ACE English Language Arts in one big fat notebook",
          "The Fault in Our Stars - John Green",
          "Flowers for Algernon - Daniel Keyes",
          "The Chrysalids - John Wyndham"
        ],
        "Science": [
          "Physical iScience"
        ],
        "French": [
          "Bien dit!: Level 1"
        ],
        "Spanish": [
          "Holt McDougal Avancemos 1",
          "Avancemos Cuaderno 1"
        ]
      },
      "9th": {
        "Math": [
          "Geometry Common Core Randalll, Basia",
          "Introduction to Geometry, 2nd Edition",
          "Algebra 1 Common Core"
        ],
        "English": [
          "Julius Caesar",
          "Maus - Art Spiegelman",
          "Bury my Heart at Wounded Knee - Dee Brown",
          "The Grapes of Wrath - John Steinbeck"
        ],
        "History": [
          "Things Fall Apart"
        ],
        "Science": [
          "Miller and Levine Biology 2010",
          "Integrated iScience, Course 3, Student Edition"
        ],
        "French": [
          "Bien dit!: Level 1"
        ],
        "Spanish": [
          "Holt McDougal Avancemos 1",
          "Avancemos Cuaderno 1"
        ],
        "Chinese": [
          "Step Up with Chinese 1",
          "Step Up with Chinese 2",
          "Step Up with Chinese 3",
          "Step Up To AP Textbook, Revised Edition 2nd Edition"
        ]
      },
      "10th": {
        "Math": [
          "Algebra 2 Common Core",
          "AoPS Intermediate Algebra",
          "Geometry Common Core Randalll, Basia"
        ],
        "English": [
          "Frankenstein",
          "The Kite Runner",
          "Lord of the Flies",
          "Othello",
          "The Picture of Dorian Gray - Oscar Wilde",
          "The Book Thief - Markus Zusak"
        ],
        "History": [
          "Night by Elie Wiesel",
          "They Say/I Say",
          "They Say/I Say, 5th Edition"
        ],
        "Science": [
          "Physics: Principles and Problems",
          "Modern Chemistry 2012",
          "Campbell Biology (11th Edition)"
        ],
        "Elective": [
          "Kinesiology An Introduction to Exercise Science",
          "Entrepreneurship: Theory, Process, Practice, 11th Edition"
        ],
        "French": [
          "Bien dit!: Level 1",
          "Bien dit!: Level 2",
        ],
        "Spanish": [
          "Holt McDougal Avancemos 1",
          "Avancemos Cuaderno 1",
          "Holt McDougal Avancemos 2",
          "Avancemos Cuaderno 2"
        ],
        "Chinese": [
          "Step Up with Chinese 1",
          "Step Up with Chinese 2",
          "Step Up with Chinese 3",
          "Step Up To AP Textbook, Revised Edition 2nd Edition"
        ]
      },
      "11th": {
        "Math": [
          "Precalculus (10th Edition)",
          "The Practice of Statistics",
          "Calculus for AP, 2nd Edition"
        ],
        "English": [
          "The Crucible by Arthur Miller",
          "Fast Food Nation by Eric Schlosserm",
          "In Cold Blood Truman Capote",
          "A Raisin in the Sun by Lorraine Hansberry",
          "The Great Gatsby by F. Scott Fitzgerald"
        ],
        "History": [
          "Give Me Liberty!: An American History",
          "Western Civilization",
          "Krugman's Economics for AP",
          "They Say/I Say",
          "They Say/I Say, 5th Edition"
        ],
        "Elective": [
          "Kinesiology An Introduction to Exercise Science",
          "Psychology: 5th Edition by Ciccarelli White",
          "Entrepreneurship: Theory, Process, Practice, 11th Edition"
        ],
        "Science": [
          "Physics: Principles and Problems",
          "Environmental Science (14th Edition)",
          "Physics: Principles with Applications",
          "Campbell Biology (11th Edition)",
          "A Molecular Approach, 3/E"
        ],
        "French": [
          "Bien dit!: Level 1",
          "Bien dit!: Level 2",
          "Bien dit!: Level 3"
        ],
        "Spanish": [
          "Holt McDougal Avancemos 1",
          "Avancemos Cuaderno 1",
          "Holt McDougal Avancemos 2",
          "Avancemos Cuaderno 2",
          "Holt McDougal Avancemos 3",
          "Avancemos Cuaderno 3",
          "TEMAS AP Spanish Language and Culture",
          "AP Spanish Workbook: Language and Culture"
        ],
        "Chinese": [
          "Step Up with Chinese 1",
          "Step Up with Chinese 2",
          "Step Up with Chinese 3",
          "Step Up To AP Textbook, Revised Edition 2nd Edition"
        ]
      },
      "12th": {
        "Math": [
          "Calculus for AP, 2nd Edition",
          "The Practice of Statistics"
        ],
        "English": [
          "Wuthering Heights by Emily Bronte",
          "The Inferno by Dante",
          "Native Speaker",
          "Catch 22",
          "The Road by Cormac McCarthy",
          "Candide by Voltaire",
          "Hamlet",
          "Macbeth",
          "Beloved - Morrison",
          "Beowulf - Seamus Heaney Translation",
          "Canterbury Tales, Chaucer - David Wright Translator",
          "David Copperfield - Dickens",
          "Never Let Me Go - Kazuo Ishiguro"
        ],
        "History": [
          "Western Civilization",
          "Krugman's Economics for AP",
          "Practical Research: Planning and Design 12th Edition"
        ],
        "Elective": [
          "Kinesiology An Introduction to Exercise Science",
          "Psychology: 5th Edition by Ciccarelli White",
          "Entrepreneurship: Theory, Process, Practice, 11th Edition"
        ],
        "Science": [
          "Physics: Principles and Problems",
          "Environmental Science (14th Edition)",
          "Physics: Principles with Applications",
          "Campbell Biology (11th Edition)",
          "A Molecular Approach, 3/E"
        ],
        "French": [
          "Bien dit!: Level 1",
          "Bien dit!: Level 2",
          "Bien dit!: Level 3"
        ],
        "Spanish": [
          "Holt McDougal Avancemos 1",
          "Avancemos Cuaderno 1",
          "Holt McDougal Avancemos 2",
          "Avancemos Cuaderno 2",
          "Holt McDougal Avancemos 3",
          "Avancemos Cuaderno 3",
          "TEMAS AP Spanish Language and Culture",
          "AP Spanish Workbook: Language and Culture"
        ],
        "Chinese": [
          "Step Up with Chinese 1",
          "Step Up with Chinese 2",
          "Step Up with Chinese 3",
          "Step Up To AP Textbook, Revised Edition 2nd Edition"
        ]
      },
      "GAP10": {
        "Math": [
          "Algebra 2 Common Core",
          "AoPS Intermediate Algebra"
        ],
        "English": [
          "NG Edge Level A Student Book",
          "Animal Farm",
          "Persepolis"
        ],
        "History": [
          "Insights into Chinese Culture",
          "English: Insights into Chinese Culture"
        ],
        "Science": [
          "Physics: Principles and Problems",
          "Modern Chemistry 2012",
          "Miller and Levine Biology 2010"
        ]
      },
      "GAP11": {
        "Math": [
          "Precalculus (10th Edition)",
          "Graphing, Numerical, Algebraic",
          "The Practice of Statistics"
        ],
        "English": [
          "NG Edge Level B Student Book",
          "The Kite Runner",
          "Lord of the Flies"
        ],
        "History": [
          "World History & Geography SE",
          "Economics: Pearson",
          "Krugman's Economics for AP",
          "They Say/I Say",
          "The Cultural Landscape"
        ],
        "Elective": [
          "Java Methods",
          "Kinesiology An Introduction to Exercise Science",
          "Psychology: 5th Edition by Ciccarelli White"
        ],
        "Science": [
          "Physics: Principles and Problems",
          "Environmental Science (14th Edition)",
          "Physics: Principles with Applications",
          "Campbell Biology (11th Edition)",
          "A Molecular Approach, 3/E"
        ],
        "French": [
          "Bien dit!: Level 1",
          "Bien dit!: Workbook Level 1",
          "Bien dit!: Level 2",
          "Bien dit!: Workbook Level 2"
        ],
        "Spanish": [
          "Holt McDougal Avancemos 1",
          "Avancemos Cuaderno 1",
          "Holt McDougal Avancemos 2",
          "Avancemos Cuaderno 2"
        ]
      },
      "GAP12": {
        "Math": [
          "Graphing, Numerical, Algebraic",
          "The Practice of Statistics"
        ],
        "English": [
          "NG Edge Level C Student Book",
          "1984",
          "Maus",
          "Literature: Reading, Reacting, Writing",
          "Wuthering Heights by Emily Bronte",
          "The Inferno by Dante",
          "Heart of Darkness",
          "The Road by Cormac McCarthy",
          "Candide by Voltaire",
          "Hamlet"
        ],
        "History": [
          "United States History and Geography",
          "Economics: Pearson",
          "Krugman's Economics for AP",
          "Practical Research: Planning and Design 11th Edition",
          "The Cultural Landscape"
        ],
        "Elective": [
          "Java Methods",
          "Kinesiology An Introduction to Exercise Science",
          "Psychology: 5th Edition by Ciccarelli White"
        ],
        "Science": [
          "Miller and Levine Biology 2010",
          "Physics: Principles and Problems",
          "Environmental Science (14th Edition)",
          "Physics: Principles with Applications",
          "Campbell Biology (11th Edition)",
          "A Molecular Approach, 3/E"
        ],
        "French": [
          "Bien dit!: Level 1",
          "Bien dit!: Workbook Level 1",
          "Bien dit!: Level 2",
          "Bien dit!: Workbook Level 2"
        ],
        "Spanish": [
          "Holt McDougal Avancemos 1",
          "Avancemos Cuaderno 1",
          "Holt McDougal Avancemos 2",
          "Avancemos Cuaderno 2"
        ]
      }
    },
    isbn: {
      "Folger Shakespeare Library Romeo and Juliet": "9780451526861",
      "TEMAS AP Spanish Language and Culture": "9781543301380",
      "Bien dit!: Workbook Level 2": "9780547951843",
      "Miller and Levine Biology 2010": "9780328925124",
      "World Geography - Western": "9780133638080",
      "Julius Caesar": "9780743482745",
      "Bien dit!: Level 3": "9780544861350",
      "Practical Research: Planning and Design 11th Edition": "9781292095875",
      "The Great Gatsby by F. Scott Fitzgerald": "9780743273565",
      "The Kite Runner": "9781594631931",
      "Holt McDougal Avancemos 3": "9780544861237",
      "Fast Food Nation by Eric Schlosserm": "9780547750330",
      "Lord of the Flies": "9780140283334",
      "Precalculus (10th Edition)": "9780321979070",
      "Bien dit!: Workbook Level 3": "9780547951850",
      "Geometry Common Core Randalll, Basia": "9780133281156",
      "AP Chinese: Harvest Textbook (2nd Edition)": "9789814455169",
      "United States History": "9780133196795",
      "Life iScience": "9780076772841",
      "Things Fall Apart": "9780385474542",
      "Give Me Liberty!: An American History": "9780393920260",
      "Antigone": "9781799224440",
      "Heart of Darkness": "9781503275928",
      "Literature: Reading, Reacting, Writing": "9781111836962",
      "To Kill a Mockingbird": "9780446310789",
      "The Ways of the World by Robert Strayer": "9780312583491",
      "Step Up with Chinese 1": "9789814839136",
      "Romeo and Juliet 1st Edition": "9780393926262",
      "Holt McDougal Avancemos 1": "9780544861213",
      "Physics: Principles and Problems": "9780076774760",
      "A Raisin in the Sun by Lorraine Hansberry": "9780679755333",
      "Frankenstein": "9780743487580",
      "Esperanza Rising": "9780439120425",
      "Java Methods": "9780982477564",
      "The Road by Cormac McCarthy": "9780307387899",
      "Fahrenheit 451 by Ray Bradbury": "9781451690316",
      "AP Spanish Workbook: Language and Culture": "9781543301397",
      "Macbeth": "9780743477109",
      "Kampung Boy": "9781596431218",
      "Across the Centuries (Houghton Mifflin)": "9780618195541",
      "A Boy in the Striped Pajamas": "9781862305274",
      "Stargirl by Jerry Spinelli": "9781408341025",
      "Hamlet": "9780743477123",
      "Economics: Pearson": "9780133328417",
      "Freak The Mighty": "9780439286060",
      "Campbell Biology (11th Edition)": "9781292170435",
      "Physics: Principles with Applications": "9781292057125",
      "The Art of Problem Solving - Introduction to Algebra": "9781934124147",
      "They Say/I Say": "9780393631678",
      "Algebra 1 Common Core": "9780133185485",
      "Candide by Voltaire": "9781957240169",
      "Holt McDougal Avancemos 2": "9780544861220",
      "Avancemos Cuaderno 2": "9780618765997",
      "The Giver by Lois Lowry": "9780544336261",
      "Graphing, Numerical, Algebraic": "9780133178579",
      "Earth & Space iScience": "9780076773855",
      "Psychology: 5th Edition by Ciccarelli White": "9780134477961",
      "The Practice of Statistics": "9781319269296",
      "Step Up with Chinese 2": "9789814866118",
      "The Good Earth": "9781476733043",
      "Course 3 Mathematics (Common Core)": "9781256737223",
      "Wuthering Heights by Emily Bronte": "9781853260018",
      "Kinesiology An Introduction to Exercise Science": "9781550772333",
      "Night by Elie Wiesel": "9780374500016",
      "The Hunger Games: Book 1": "9780439023528",
      "Environmental Science (14th Edition)": "9780079030474",
      "In Cold Blood Truman Capote": "9780679745587",
      "Krugman's Economics for AP": "9781319113278",
      "Physical iScience": "9780076773053",
      "The Cultural Landscape": "9780135116159",
      "Algebra 2 Common Core": "9780133281163",
      "Tuesdays with Morrie": "9780751529814",
      "A Night Divided by Jennifer A. Nielson": "9780545682442",
      "Bien dit!: Workbook Level 1": "9780547951867",
      "Bien dit!: Level 1": "9780544861336",
      "A Midsummer Night's Dream": "9781586638481",
      "The Inferno by Dante": "9780451531391",
      "Bud, Not Buddy": "9780553494105",
      "Modern Chemistry 2012": "9780544817845",
      "A Molecular Approach, 3/E": "2199000096293",
      "World Geography: Eastern Hemisphere 2012": "9780547484808",
      "American Born Chinese": "0312384483",
      "Pride and Prejudice": "9780307950901",
      "One Thousand and One Arabian Nights": "9780192750136",
      "THEMES (2016 Edition)": "9781680040272",
      "Avancemos Cuaderno 1": "9780618765980",
      "Introduction to Geometry, 2nd Edition": "9781934124086",
      "Avancemos Cuaderno 3": "9780618766000",
      "Bien dit!: Level 2": "9780544861343",
      "Step Up with Chinese 3": "9789814866897",
      "The Outsiders": "9780140385724",
      "AoPS Intermediate Algebra": "9781934124048",
      "The Crucible by Arthur Miller": "9780140481389",
      "NG Edge Level A Student Book": "9781285439488",
      "Animal Farm": "9780451526342",
      "Persepolis": "9780375714573",
      "Insights into Chinese Culture": "9787560099842",
      "English: Insights into Chinese Culture": "9787544608299",
      "NG Edge Level B Student Book": "9781285439587",
      "World History & Geography SE": "9780076683864",
      "NG Edge Level C Student Book": "9781285439594",
      "1984": "9780452284234",
      "Maus": "9780141014081",
      "United States History and Geography": "9780076646883",
      "Atonement Ian McEwan": "9780385721790",
      "Native Speaker": "9781573225311",
      "Notes from the Underground": "9780553211443",
      "Catch 22": "9781451626650",
      "Integrated iScience, Course 1, Student Edition (INTEGRATED SCIENCE) 1st Edition": "9780076772766",
      "Great Expectations": "9781853260049",
      "Western Civilization": "9781337696463",
      "Entrepreneurship: Theory, Process, Practice, 11th Edition": "9780357033890",
      "Bless Me, Ultima": "9780446600255",
      "To the Lighthouse": "9781853260919",
      "Everything you need to ACE English Language Arts in one big fat notebook": "9780761160915",
      "Kira-Kira": "9780689856402",
      "Integrated iScience, Course 2, Student Edition": "9780076773510",
      "The Fault in Our Stars - John Green": "9780142424179",
      "Flowers for Algernon - Daniel Keyes": "9780156030304",
      "The Chrysalids - John Wyndham": "9780141032979",
      "Maus - Art Spiegelman": "9780141014081",
      "Bury my Heart at Wounded Knee - Dee Brown": "9780606265867",
      "The Grapes of Wrath - John Steinbeck": "9780143039433",
      "Integrated iScience, Course 3, Student Edition": "9780076772872",
      "Othello": "9780743477550",
      "The Picture of Dorian Gray - Oscar Wilde": "9780393696875",
      "The Book Thief - Markus Zusak": "9780375842207",
      "They Say/I Say, 5th Edition": "9780393538700",
      "Calculus for AP, 2nd Edition": "9780357431948",
      "Beloved - Morrison": "9781400033416",
      "Beowulf - Seamus Heaney Translation": "9780393320978",
      "Canterbury Tales, Chaucer - David Wright Translator": "9780307743534",
      "David Copperfield - Dickens": "9780140439441",
      "Never Let Me Go - Kazuo Ishiguro": "9781400078776",
      "Practical Research: Planning and Design 12th Edition": "9781292339245",
      "Step Up To AP Textbook, Revised Edition 2nd Edition": "9789814962230"
    }
  }
})