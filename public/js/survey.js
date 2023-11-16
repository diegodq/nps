const urlSurvey = window.location.href
const CNPJ = urlSurvey.split(/=|\//)[4]
const storeID = urlSurvey.split(/=|\//)[5]
const anchorQuestionField = document.getElementById('anchor-question-field')
const imageBrandClient = document.getElementById('brand-client')
const divImageClient = document.querySelector('.img-client')
const tagPStoreInformation = document.getElementById('store-field')
const componentAnchorQuestion = $('#component-anchor-question')
const containerQuestions = document.getElementById('container-questions')
const urlApi = 'http://localhost:3007'

window.addEventListener('load', async (event) => {

    await setParamsColor()
    await getAndSetLogoClient()

    const allowProtectIp = await allowOrNotProtectIp() === 1 ? true : false

    if (allowProtectIp) {

        const ipLocked = await verifyIpBlock()

        if (ipLocked) {

            makeEndScreen()
            return
        }

    }

    const multiIsAble = await multiStoreVerify()

    if (!multiIsAble && storeID) {

        await displayNotFoundMessage()
        return

    }

    if (multiIsAble) {

        const storeList = await getStoreList()
        const storeIdExistsInList = storeList.some(element => String(element.id) === storeID)

        if (!storeID || !storeIdExistsInList) {

            await displayNotFoundMessage()
            return

        }

        await setStoreInformation(await getStoreInformation(storeID))

    }

    componentAnchorQuestion.removeClass('d-none')
    componentAnchorQuestion.fadeIn(600)
    await setAnchorQuestion()

})

async function allowOrNotProtectIp() {

    const response = await fetch(`${urlApi}/nps/product/params/${CNPJ}`, {
        headers: {
            'Content-Type': 'application/json'
        }
    })

    const data = await response.json()

    return data.product.lockByIp

}

async function getStoreInformation(storeID) {

    const response = await fetch(`${urlApi}/info/store/${storeID}`, {
        headers: {
            'Content-Type': 'application/json'
        }
    })

    const infoStore = await response.json()
    console.log(infoStore)
    return infoStore.message[0]


}

async function setStoreInformation(dataStore) {

    tagPStoreInformation.textContent = `${dataStore.name} - ${dataStore.address}`

}

async function verifyIpBlock() {

    const response = await fetch(`${urlApi}/nps/header/${CNPJ}/${await getIpClient()}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const data = await response.json()

    return data.allowResearch

}

async function getStoreList() {

    const response = await fetch(`${urlApi}/list/store/${CNPJ}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const data = await response.json()

    return data.message

}

async function multiStoreVerify() {

    const response = await fetch(`${urlApi}/multistore/${CNPJ}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const data = await response.json()

    return data

}

async function getIpClient() {

    const response = await fetch('https://api.ipify.org?format=json')

    const data = await response.json()

    return data.ip
}

async function getHashResearch() {

    const response = await fetch(`${urlApi}/new/date`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const dataServer = await response.json()

    const dataHash = dataServer + CNPJ + Math.random()

    return dataHash
}

async function formatDataForRequest(data, npsAnswer, dateStart, employeeName, storeID) {

    const dateServer = await getHashResearch()
    const nameClient = document.getElementById('name-client') === null ? '' : document.getElementById('name-client').value
    const phoneClient = document.getElementById('phone-client') === null ? '' : document.getElementById('phone-client').value
    const deviceClient = await getInformationClient()

    for (const answer of data) {
        answer.id_research = dateServer
        answer.nps_answer = npsAnswer
        answer.client_name = nameClient
        answer.client_phone = phoneClient
        answer.ip_address = await getIpClient()
        answer.device_client = deviceClient
        answer.start_research = dateStart
        answer.name_employee = employeeName
        answer.store = storeID === undefined ? null : storeID
    }

    return data

}

async function saveAnswerResearch(dataResearch) {

    console.log('ANSWERS DO FETCH', dataResearch)

    const response = await fetch(`${urlApi}/answer`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataResearch)
    })

    const data = await response.json()

    console.log(data)

}

async function getParamsProduct() {

    const response = await fetch(`${urlApi}/nps/product/params/${CNPJ}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })


    const data = await response.json()

    return data.product.paramsProduct[0]

}

async function getParamsAndQuestions() {

    const response = await fetch(`${urlApi}/nps/company/${CNPJ}/questions`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const dataParams = await response.json()

    const paramsAndQuestions = []
    dataParams.questions.forEach(element => {

        const newParamQuestion = editDataParamsQuestion(element)
        paramsAndQuestions.push(newParamQuestion)

    })

    return paramsAndQuestions

}

async function getDepartments() {

    const response = await fetch(`${urlApi}/nps/departments/${CNPJ}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const data = await response.json()

    return data.departments[0]

}

async function getTopics() {

    const response = await fetch(`${urlApi}/nps/topic/${CNPJ}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const topics = await response.json()

    return topics.topic[0]
}

function editDataParamsQuestion(obj) {

    const { params_questions, company, ...rest } = obj
    const newObject = { ...params_questions, ...rest }

    return newObject
}

async function setParamsColor() {

    const allParams = await getParamsProduct();

    const bgColor = allParams.background_color;
    const fontColor = allParams.font_color;

    const gradient = generateGradient(bgColor)

    document.body.style.background = `linear-gradient(to bottom right, ${gradient}) fixed`
    document.body.style.backgroundRepeat = 'no-repeat'
    document.body.style.backgroundSize = 'cover'

    document.body.style.height = '100%'
    document.documentElement.style.height = '100%'
    document.documentElement.style.overflow = 'auto'
    document.documentElement.style.margin = '0'

    // Cor do texto
    document.body.style.color = fontColor
    document.querySelectorAll('a').forEach(function (link) {
        link.style.color = fontColor
    })
}

function generateGradient(color) {
    const gradientScale = chroma.scale([color, chroma(color).darken(0.5)]).mode('lch')
    const gradientColors = gradientScale.colors(200)
    return gradientColors.map(color => chroma(color).css()).join(', ')
}

async function getAndSetLogoClient() {

    const response = await fetch(`${urlApi}/nps/header/${CNPJ}/${await getIpClient()}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const data = await response.json()

    if (data.logo != '') {

        divImageClient.classList.remove('d-none')
        imageBrandClient.setAttribute('src', data.logo)

    } else {

        divImageClient.classList.add('d-none')

    }

}

async function getDataAnchorQuestion() {

    const response = await fetch(`${urlApi}/nps/header/${CNPJ}/${await getIpClient()}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const data = await response.json()

    return data.anchorQuestion

}

async function setAnchorQuestion() {

    const anchorQuestion = await getDataAnchorQuestion()

    if (anchorQuestion === '') {

        anchorQuestionField.innerText = 'NÃO HÁ PERGUNTA ÂNCORA CADASTRADA.'

    } else {

        anchorQuestionField.innerText = anchorQuestion
    }

}

const svgElements = document.querySelectorAll('.svg-nps');
let clickDisabled = false

svgElements.forEach((element) => {
    element.addEventListener('click', async () => {
        if (clickDisabled) {
            return
        }

        clickDisabled = true

        const dataTreeValue = element.getAttribute('data-tree')
        const paramsProduct = await getParamsProduct()
        const paramPassingTree = paramsProduct.passing_tree

        const processClick = async () => {
            const dateStart = new Date()

            if (dataTreeValue < paramPassingTree) {
                fadeComponents(componentAnchorQuestion);
                setTimeout(async () => {
                    const negativeQuestions = await getNegativeQuestions();
                    console.log(negativeQuestions);
                    renderQuestion(negativeQuestions, dataTreeValue, dateStart).then((answers) => {
                        clickDisabled = false
                    })
                }, 600)
            } else {
                fadeComponents(componentAnchorQuestion);
                setTimeout(async () => {
                    const positiveQuestions = await getPositiveQuestions();
                    console.log(positiveQuestions);
                    renderQuestion(positiveQuestions, dataTreeValue, dateStart).then((answers) => {
                        clickDisabled = false
                    })
                }, 600)
            }
        }

        await processClick()
    })
})

function fadeComponents(componentOut, componentIn) {

    if (componentIn == undefined) {

        componentOut.fadeOut(600, function () { componentOut.addClass('d-none') })

    } else {

        componentOut.fadeOut(600, function () {
            componentOut.addClass('d-none')
            componentIn.removeClass('d-none')
            componentIn.fadeIn(600)
        })

    }

}

async function getPositiveQuestions() {

    const paramsAndQuestions = await getParamsAndQuestions()

    const positiveQuestions = paramsAndQuestions.filter(param => param.tree_question == 1 && param.status === 1)


    positiveQuestions.sort((a, b) => {
        if (a.position === null) return 1
        if (b.position === null) return -1
        return a.position - b.position
    })

    return positiveQuestions

}

async function getNegativeQuestions() {

    const paramsAndQuestions = await getParamsAndQuestions()
    console.log(paramsAndQuestions)
    const negativeQuestions = paramsAndQuestions.filter(param => !param.tree_question == 1 && param.status === 1)

    negativeQuestions.sort((a, b) => {
        if (a.position === null) return 1
        if (b.position === null) return -1
        return a.position - b.position
    })

    return negativeQuestions

}

async function renderQuestion(questions, npsAnswer, dateStart) {

    let currentQuestionIndex = 0
    const answers = []

    async function showNextQuestion(element) {

        if (currentQuestionIndex >= questions.length) {

            makeEndScreen()
            const elementQuestionFadeOut = $(`#${element}`)
            fadeComponents(elementQuestionFadeOut)

            return
        }

        const question = questions[currentQuestionIndex]
        console.log(question)
        console.log(currentQuestionIndex)
        console.log(question.type_question)

        const allParams = await getParamsProduct()
        const bgColor = allParams.background_color
        const fontColor = allParams.font_color

        if (question.type_question === "binary") {

            const responseQuestion = await makeBinaryQuestion(
                currentQuestionIndex,
                question.question_description,
                question.option_one,
                question.option_two,
                generateGradient(fontColor),
                bgColor
            ).then((selectedOption) => {
                return selectedOption
            })

            const elementQuestionFadeOut = $(`#${element}`)
            fadeComponents(elementQuestionFadeOut)
            currentQuestionIndex++

            const answerQuestion = { question: question.id, answer: responseQuestion }

            console.log(answerQuestion)
            answers.push(answerQuestion)

            setTimeout(() => {
                showNextQuestion(`component-${currentQuestionIndex}`)
            }, 600)


        }

        if (question.type_question === "import") {

            const importData =
                question.import_type == "department"
                    ? await createCheckboxList(await getDepartments())
                    : await createCheckboxList(await getTopics())

            const responseQuestion = await makeImportQuestion(
                currentQuestionIndex,
                question.question_description,
                importData,
                question.mandatory_question
            ).then((checkboxClicado) => {
                return checkboxClicado
            })



            if (question.import_type == 'department') {

                const elementQuestionFadeOut = $(`#${element}`)
                fadeComponents(elementQuestionFadeOut)
                currentQuestionIndex++

                const answerQuestion = { question: question.id, answer: responseQuestion }

                console.log(answerQuestion)
                answers.push(answerQuestion)

                setTimeout(function () {
                    showNextQuestion(`component-${currentQuestionIndex}`)
                }, 600)

            }

            if (question.import_type == 'topics') {

                const topics = await getTopics()

                const newResponse = responseQuestion.split(',')

                const topicWithEmployeeRequest = topics.find(topic => {
                    console.log(topic.indicate_employee)
                    if (topic.indicate_employee === 1)
                        return topic
                })

                const callEmployeeRequest = newResponse.some(response => response === topicWithEmployeeRequest.name)

                if (callEmployeeRequest) {


                    const teste = await showInputAlert()
                    console.log(teste)

                    const elementQuestionFadeOut = $(`#${element}`)
                    fadeComponents(elementQuestionFadeOut)
                    currentQuestionIndex++

                    const answerQuestion = { question: question.id, answer: responseQuestion }

                    console.log(answerQuestion)
                    answers.push(answerQuestion)

                    setTimeout(function () {
                        showNextQuestion(`component-${currentQuestionIndex}`)
                    }, 600)


                } else {

                    const elementQuestionFadeOut = $(`#${element}`)
                    fadeComponents(elementQuestionFadeOut)
                    currentQuestionIndex++

                    const answerQuestion = { question: question.id, answer: responseQuestion }

                    console.log(answerQuestion)
                    answers.push(answerQuestion)

                    setTimeout(function () {
                        showNextQuestion(`component-${currentQuestionIndex}`)
                    }, 600)


                }


            }

        }

        if (question.type_question === "input") {

            console.log(question)
            console.log(currentQuestionIndex)
            const responseQuestion = await makeFreeInputQuestion(
                currentQuestionIndex,
                question.question_description,
                question.mandatory_question,
            ).then((labelText) => {
                return labelText
            })

            setTimeout(function () {
                showNextQuestion(`component-${currentQuestionIndex}`)
            }, 600)

            const elementQuestionFadeOut = $(`#${element}`)
            fadeComponents(elementQuestionFadeOut)
            currentQuestionIndex++

            const answerQuestion = { question: question.id, answer: responseQuestion }

            console.log(answerQuestion)
            answers.push(answerQuestion)

        }

        if (question.type_question === "alert") {

            await makeAlertQuestion(question.alert_label)

            setTimeout(function () {
                showNextQuestion(`component-${currentQuestionIndex}`)
            }, 600)

            currentQuestionIndex++

        }

        if (question.type_question === "contact") {

            console.log(question)

            function handleImportInputChange() {
                setTimeout(function () {
                    showNextQuestion(`component-${currentQuestionIndex}`)
                }, 600);
            }

            const contactData = await makeContactQuestion(currentQuestionIndex, question.mandatory_question)

            handleImportInputChange()
            const elementQuestionFadeOut = $(`#${element}`)
            fadeComponents(elementQuestionFadeOut)
            currentQuestionIndex++

        }

        if (question.type_question === "finish") {

            const responseQuestion = await makeFinishQuestion(
                currentQuestionIndex,
                question.text_end_research,
                question.text_label_one,
                question.text_label_two,
                generateGradient(fontColor),
                bgColor
            ).then((selectedOption) => {
                return selectedOption
            })

            if (responseQuestion === 'option1') {

                setTimeout(function () {
                    showNextQuestion(`component-${currentQuestionIndex}`)
                }, 600)
                const elementQuestionFadeOut = $(`#${element}`)
                fadeComponents(elementQuestionFadeOut)
                currentQuestionIndex++

            } else {

                setTimeout(function () {
                    showNextQuestion(`component-${currentQuestionIndex}`)
                }, 600)


                const elementQuestionFadeOut = $(`#${element}`)
                fadeComponents(elementQuestionFadeOut)

                currentQuestionIndex = questions.length

                const answerQuestion = { question: question.id, answer: '' }

                console.log(answerQuestion)
                answers.push(answerQuestion)

            }
        }

    }

    const employeeName = []

    async function showInputAlert() {
        const swalWithBootstrapButtons = Swal.mixin({
            customClass: {
                confirmButton: 'btn mr-2 btn-fixed-size custom-confirm-button-class',
                cancelButton: 'btn mr-2 btn-fixed-size custom-cancel-button-class',
            },
            buttonsStyling: false
        });

        // Crie uma Promise para aguardar a resposta do usuário.
        return new Promise(async (resolve, reject) => {
            const result = await swalWithBootstrapButtons.fire({
                title: 'Destacar algum Colaborador?',
                text: 'Algum de nossos colaboradores foi responsável pela sua experiência?',
                input: 'text',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Você precisa inserir algum nome para gravar. Caso não queira indicar, clique em Não e prossiga com a pesquisa.';
                    }
                },
                showCancelButton: true,
                cancelButtonText: 'Não',
                confirmButtonText: 'Indicar',
                reverseButtons: true
            });

            if (result.isConfirmed) {
                const inputValue = result.value;
                if (inputValue) {
                    employeeName.push(inputValue.toUpperCase());
                }
                resolve()
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                resolve()
            }
        });
    }

    showNextQuestion(`component-${currentQuestionIndex}`)

    return new Promise((resolve) => {

        async function collectAnswers() {

            if (currentQuestionIndex >= questions.length) {

                resolve(answers)
                const formatedAnswer = await formatDataForRequest(answers, Number(npsAnswer), dateStart, employeeName[0], storeID)
                console.log(formatedAnswer, 'data do fetch')
                saveAnswerResearch(formatedAnswer)

            } else {

                setTimeout(collectAnswers, 10)

            }
        }
        collectAnswers()
        console.log(answers)
    })

}


async function makeFreeInputQuestion(indexResearch, bodyQuestion, mandatoryQuestion) {

    return new Promise(async (resolve) => {
        const allParams = await getParamsProduct()
        const bgColor = allParams.background_color
        const fontColor = allParams.font_color
        const fontColorGradient = generateGradient(fontColor)

        const questionElement = document.createElement("div")
        questionElement.id = `component-${indexResearch}`
        questionElement.classList.add(
            "input-group",
            "d-flex",
            "flex-column",
            "align-items-center"
        )

        questionElement.innerHTML = `
            <h3>${bodyQuestion}</h3>
            <textarea class="form-control rounded" id="textArea-${indexResearch}" rows="3" style="width: 75vw; border-color: ${fontColor};"></textarea>
            <span id="error-message" style="color: red;"></span>
            <input type="button" id="input-free" class="btn mt-4 rounded input-free-button" value="AVANÇAR" style="background: linear-gradient(to bottom right, ${fontColorGradient}); color: ${bgColor}">
        `

        containerQuestions.appendChild(questionElement);

        const buttons = document.querySelectorAll(".input-free-button")

        buttons.forEach((button, index) => {
            button.addEventListener("click", async () => {

                const textarea = document.getElementById(`textArea-${indexResearch}`); // Obtenha o textarea correto com base no índice da pergunta

                const questionIsMandatory = mandatoryQuestion === 1 ? true : false;

                if (questionIsMandatory) {
                    const answerIsValid = await validationInputTextArea(textarea);

                    if (answerIsValid) {
                        resolve(textarea.value);
                    }
                } else {
                    resolve(textarea.value);
                }
            });
        });
    })
}

async function makeBinaryQuestion(index, bodyQuestion, Option1, Option2, fontGradient, bgGradient) {
    return new Promise((resolve) => {

        const questionElement = document.createElement("div");
        questionElement.id = `component-${index}`;
        questionElement.classList.add(
            "input-group",
            "d-flex",
            "flex-column",
            "align-items-center"
        )

        questionElement.innerHTML = `
        <h3>${bodyQuestion}</h3>
        <div class="btn-group-toggle" data-toggle="buttons">
            <label class="btn m-2 btn-fixed-size" style="background: linear-gradient(to bottom right, ${fontGradient}); color: ${bgGradient}">
                <input type="radio" name="option" value="option1">${Option1}
            </label>
            <label class="btn m-2 btn-fixed-size" style="background: linear-gradient(to bottom right, ${fontGradient}); color: ${bgGradient}">
                <input type="radio" name="option" value="option2">${Option2}
            </label>
        </div>
    `

        containerQuestions.appendChild(questionElement)

        const buttons = questionElement.querySelectorAll("[type='radio']");

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const selectedOption = button.value == 'option1' ? Option1 : Option2
                resolve(selectedOption);
            })
        })
    })
}

async function makeImportQuestion(index, bodyQuestion, dataCheckBoxs, mandatoryQuestion) {

    return new Promise(async (resolve, reject) => {
        const allParams = await getParamsProduct()
        const bgColor = allParams.background_color
        const fontColor = allParams.font_color
        const fontColorGradient = await generateGradient(fontColor)

        const questionElement = document.createElement("div")
        questionElement.id = `component-${index}`
        questionElement.classList.add(
            "input-group",
            "d-flex",
            "flex-column",
            "align-items-center"
        )

        const headingElement = document.createElement("h3");
        headingElement.textContent = bodyQuestion;
        questionElement.appendChild(headingElement);

        if (dataCheckBoxs instanceof HTMLElement) {
            questionElement.appendChild(dataCheckBoxs.cloneNode(true))
        }

        const labels = questionElement.querySelectorAll("label")
        const selectedLabels = []

        function getFormattedLabels() {
            return selectedLabels.join(',')
        }

        labels.forEach(label => {
            label.addEventListener('click', (event) => {

                const labelIndex = selectedLabels.indexOf(label.textContent);

                if (labelIndex === -1) {

                    label.classList.add('selected');
                    selectedLabels.push(label.textContent);
                    errorMessageElement.textContent = ""
                } else {

                    label.classList.remove('selected');
                    selectedLabels.splice(labelIndex, 1);
                    errorMessageElement.textContent = ""
                }

            });
        });

        containerQuestions.appendChild(questionElement);

        const errorMessageElement = document.createElement("span");
        errorMessageElement.id = "import-error-message";
        errorMessageElement.style.color = "red";
        questionElement.appendChild(errorMessageElement)

        const advanceButton = document.createElement("input")
        advanceButton.type = "button"
        advanceButton.id = "advance-import-button"
        advanceButton.classList.add("btn", "mt-4", "rounded")
        advanceButton.value = "AVANÇAR"
        advanceButton.style.background = `linear-gradient(to bottom right, ${fontColorGradient})`
        advanceButton.style.color = bgColor

        questionElement.appendChild(advanceButton);

        advanceButton.addEventListener('click', async (event) => {
            const questionIsMandatory = mandatoryQuestion === 1 ? true : false

            console.log(questionIsMandatory)
            console.log(mandatoryQuestion)

            if (questionIsMandatory) {

                const someLabelSelected = await validateImportQuestion(selectedLabels)

                if (someLabelSelected) {

                    resolve(getFormattedLabels())

                }

            } else {

                resolve(getFormattedLabels())

            }

        });
    });
}

async function makeAlertQuestion(textAlert) {

    const allParams = await getParamsProduct();
    const bgColor = allParams.background_color;
    const fontColor = allParams.font_color;
    const fontColorGradient = await generateGradient(fontColor);

    const style = document.createElement('style');

    style.innerHTML = `
        .custom-warning-icon .swal2-icon--warning {
            background-color: ${fontColor} !important;
            color: ${fontColor} !important;
        }
    `;
    document.head.appendChild(style);

    Swal.fire({
        title: 'Alerta',
        html: `<span style="color: ${fontColor}">${textAlert}</span>`,
        icon: 'warning',
        confirmButtonText: 'Entendi!',
        customClass: {
            confirmButton: 'btn mr-2 btn-fixed-size custom-confirm-button-class',
        },
    });

    const swalContainer = document.querySelector('.swal2-container');
    const button = swalContainer.querySelector('.swal2-confirm');

    swalContainer.style.backgroundColor = bgColor;
    button.style.background = `linear-gradient(to bottom right, ${fontColorGradient})`;
    button.style.color = bgColor;
}

async function makeFinishQuestion(index, bodyQuestion, Option1, Option2, fontGradient, bgGradient) {

    return new Promise((resolve) => {

        const questionElement = document.createElement("div");
        questionElement.id = `component-${index}`;
        questionElement.classList.add(
            "input-group",
            "d-flex",
            "flex-column",
            "align-items-center"
        );

        questionElement.innerHTML = `
        <h3>${bodyQuestion}</h3>
        <div class="btn-group-toggle" data-toggle="buttons">
            <label class="btn m-2 btn-fixed-size" style="background: linear-gradient(to bottom right, ${fontGradient}); color: ${bgGradient}">
                <input type="radio" name="option1" value="option1">${Option1}
            </label>
            <label class="btn m-2 btn-fixed-size" style="background: linear-gradient(to bottom right, ${fontGradient}); color: ${bgGradient}">
                <input type="radio" name="option2" value="option2">${Option2}
            </label>
        </div>
    `

        containerQuestions.appendChild(questionElement);

        const buttons = questionElement.querySelectorAll("[type='radio']");

        buttons.forEach((button) => {
            button.addEventListener("click", () => {

                const selectedOption = button.value
                resolve(selectedOption)

            })
        })
    })
}

async function makeContactQuestion(index, mandatoryQuestion) {

    return new Promise(async (resolve) => {

        const allParams = await getParamsProduct();
        const bgColor = allParams.background_color;
        const fontColor = allParams.font_color;
        const fontColorGradient = generateGradient(fontColor)

        const questionElement = document.createElement("div")
        questionElement.id = `component-${index}`
        questionElement.classList.add(
            "input-group",
            "d-flex",
            "flex-column",
            "align-items-center"
        )

        questionElement.innerHTML = `
            <h3>Deixe-nos o seu contato:</h3>
            <form>
                <div class="form-group">
                    <label for="name" class="font-weight-bold" >SEU NOME:</label>
                    <input type="text" id="name-client" class="form-control rounded" style="border-color: ${fontColor};" />
                    <span id="error-message-name" style="color: red;"></span>
                    </div>
                <div class="form-group">
                    <label for="phone" class="font-weight-bold" >CELULAR:</label>
                    <input type="text" id="phone-client" class="form-control rounded" style="border-color: ${fontColor};"/>
                    <span id="error-message-phone" style="color: red;"></span>
                </div>
                <input type="button" id="button-input-contact" class="btn mt-4 rounded" value="AVANÇAR" style="background: linear-gradient(to bottom right, ${fontColorGradient}); color: ${bgColor}" value="AVANÇAR" />
            </form>
        `

        containerQuestions.appendChild(questionElement);

        $('#phone-client').inputmask('(99) 9 9999-9999[9]')

        const button = document.getElementById("button-input-contact")

        button.addEventListener("click", async () => {

            const nameClient = $('#name-client').val()
            const phoneClient = $('#phone-client').val()

            const questionIsMandatory = mandatoryQuestion === 1 ? true : false

            if (questionIsMandatory) {

                const fieldsContatIsValid = await validateContactQuestion(nameClient, phoneClient)

                if (fieldsContatIsValid) {

                    console.log('enviar no fetch', { nome: nameClient, telefone: phoneClient })
                    resolve()

                }

            } else {

                console.log('enviar no fetch', { nome: nameClient, telefone: phoneClient })
                resolve()

            }


        })

    })
}

async function makeEndScreen() {

    return new Promise(async (resolve) => {

        const allParams = await getParamsProduct();
        const bgColor = allParams.background_color;
        const fontColor = allParams.font_color;
        const fontColorGradient = generateGradient(fontColor)

        const questionElement = document.createElement("div")
        questionElement.classList.add(
            "input-group",
            "d-flex",
            "flex-column",
            "align-items-center"
        )

        questionElement.innerHTML = `
        <span class="bi bi-ui-checks" style="font-size: 150px;"></span>
        <h1>Obrigado!</h1>
        <p>Sua pesquisa foi enviada com sucesso!</p>
        `

        containerQuestions.appendChild(questionElement)

        resolve()

    })
}

async function displayNotFoundMessage() {
    return new Promise(async (resolve) => {

        const allParams = await getParamsProduct();
        const bgColor = allParams.background_color;
        const fontColor = allParams.font_color;
        const fontColorGradient = generateGradient(fontColor);

        const notFoundElement = document.createElement("div");
        notFoundElement.classList.add(
            "input-group",
            "d-flex",
            "flex-column",
            "align-items-center"
        );

        notFoundElement.innerHTML = `
            <span class="bi bi-exclamation-diamond" style="font-size: 150px;"></span>
            <h1>Oops!</h1>
            <p>Não encontramos pesquisa para a loja informada.</p>
        `;

        containerQuestions.appendChild(notFoundElement);

        // Aqui você pode adicionar mais lógica, se necessário, para lidar com a mensagem de não encontrado

        resolve();
    });
}

function waitForUserResponseBinaryQuestion() {
    return new Promise(resolve => {
        const optionInputs = document.querySelectorAll('input[name="option"]')
        optionInputs.forEach(input => {
            input.addEventListener("click", () => {
                // Ação específica para cada resposta selecionada
                const selectedValue = input.value
                if (selectedValue === "option1") {
                    // Ação para a opção 1
                    //console.log("Opção 1 selecionada")


                } else if (selectedValue === "option2") {
                    // Ação para a opção 2
                    //console.log("Opção 2 selecionada")

                }

                resolve()
            })
        })
    })
}

async function createCheckboxList(departmentsOrTopics) {

    const container = document.createElement('div');
    container.style.display = 'inline-block';

    const allParams = await getParamsProduct()
    const bgColor = allParams.background_color
    const fontColor = allParams.font_color

    departmentsOrTopics.forEach((item) => {

        const label = document.createElement('label');
        label.innerText = item.name;
        label.dataset.employee = item.indicate_employee
        label.classList.add('custom-label');
        label.style.display = 'inline-block';
        label.style.marginRight = '5px';
        label.style.marginLeft = '10px';
        label.style.border = `1px solid ${fontColor}`

        label.addEventListener('mouseover', () => {
            label.style.backgroundColor = bgColor
        });

        label.addEventListener('mouseout', () => {
            label.style.backgroundColor = ''
        });

        container.appendChild(label);
    })

    return container;
}

async function getInformationClient() {
    const parser = new UAParser();
    const result = parser.getResult();

    console.log("Sistema Operacional:", result.os.name);
    console.log("Tipo de Dispositivo:", result.device.type);
    console.log("Navegador:", result.browser.name);
    console.log("Modelo do Dispositov:", result.device);

    let deviceModel = result.device.model || 'Unknown'; // Tenta obter o modelo do dispositivo

    if (result.device.type === 'mobile' && deviceModel === 'Unknown') {
        // Verificar se é um dispositivo móvel e o modelo não está disponível
        deviceModel = 'Mobile Device'; // Define um valor padrão
    }

    if (result.os.name === 'Windows') {
        return 'PC-Windows';
    } else if (result.os.name === 'Mac OS') {
        return 'PC-Mac';
    } else {
        return `${result.device.type} - ${deviceModel}`;
    }
}

async function validationInputTextArea(input) {

    const inputTextAreaEmpty = input.value.trim() === '' ? false : true

    const errorMessage = document.getElementById("error-message")

    input.addEventListener("input", () => {
        errorMessage.textContent = ""
    })

    if (inputTextAreaEmpty) {

        errorMessage.textContent = ""
        return true

    } else {

        errorMessage.textContent = "Não será possível prosseguir com a pesquisa sem responder essa pergunta."

    }

}

async function validateImportQuestion(arrayLabels) {

    const arrayLabelsIsEmpty = arrayLabels.length === 0 ? true : false
    const errorMessage = document.getElementById("import-error-message")

    if (arrayLabelsIsEmpty) {

        errorMessage.textContent = "É necessário marcar ao menos uma opção para prosseguir com a pesquisa."

    } else {

        errorMessage.textContent = ""
        return true

    }

}

async function validateContactQuestion(inputName, inputPhone) {

    const errorFieldName = document.getElementById('error-message-name')
    const errorFieldPhone = document.getElementById('error-message-phone')

    const inputNameValueIsEmpty = inputName === '' ? true : false
    const inputPhoneValueIsEmpty = inputPhone === '' ? true : false

    if (inputNameValueIsEmpty) {
        errorFieldName.textContent = "Precisa inserir o nome.";
    } else if (inputPhoneValueIsEmpty) {
        errorFieldPhone.textContent = "Precisa inserir o telefone.";
    } else if (!/^[A-Za-z\s]+$/.test(inputName)) {
        errorFieldName.textContent = "Este não é um nome válido.";
    } else {
        return true;
    }

}

