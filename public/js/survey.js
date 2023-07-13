const CNPJ = '01652694000295'
const anchorQuestionField = document.getElementById('anchor-question-field')
const imageBrandClient = document.getElementById('brand-client')
const divImageClient = document.querySelector('.img-client')
const componentAnchorQuestion = $('#component-anchor-question')
const containerQuestions = document.getElementById('container-questions')
const urlApi = 'http://localhost:3007'

window.addEventListener('load', (event) => {
    getAndSetLogoClient()
    setAnchorQuestion()
    setParamsColor()
})

async function getParamsProduct() {

    const response = await fetch(`${urlApi}/nps/product/params/${CNPJ}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const data = await response.json()

    return data.product.paramsProduct[0].params_product

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
    console.log(data)
    
    return createCheckboxList(data.departments[0])

}

async function getTopics() {

    const response = await fetch(`${urlApi}/nps/topic/${CNPJ}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const topics = await response.json()

    return createCheckboxList(topics.topic[0])
}

function editDataParamsQuestion(obj) {

    const { params_questions, company, ...rest } = obj
    const newObject = { ...params_questions, ...rest }

    return newObject
}

async function setParamsColor() {

    const allParams = await getParamsProduct()
    const bgColor = allParams.background_color
    const fontColor = allParams.font_color

    document.body.style.color = fontColor
    document.body.style.backgroundColor = bgColor

}

async function getAndSetLogoClient() {

    const response = await fetch(`${urlApi}/nps/header/${CNPJ}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const data = await response.json()

    if (data.logo) {

        divImageClient.classList.remove('d-none')
        imageBrandClient.setAttribute('src', data.logo)

    } else {

        divImageClient.classList.add('d-none')

    }

}

async function getDataAnchorQuestion() {

    const response = await fetch(`${urlApi}/nps/header/${CNPJ}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const data = await response.json()

    return data.anchorQuestion[0]

}

async function setAnchorQuestion() {
    const anchorQuestion = await getDataAnchorQuestion()
    anchorQuestionField.innerText = anchorQuestion
}

const svgElements = document.querySelectorAll('.svg-nps')
svgElements.forEach((element) => {
    element.addEventListener('click', async () => {
        const dataTreeValue = element.getAttribute('data-tree')
        const paramsProduct = await getParamsProduct()
        const paramPassingTree = paramsProduct.passing_tree

        if (dataTreeValue < paramPassingTree) {

            fadeComponents(componentAnchorQuestion)
            renderNegativeQuestions()
            console.log('árvore negativa')

        } else {

            fadeComponents(componentAnchorQuestion)
            renderPositiveQuestions()
            console.log('árvore positiva')

        }

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
    const positiveQuestions = paramsAndQuestions.filter(param => param.tree_question == 1)

    positiveQuestions.sort((a, b) => {
        if (a.position === null) return 1
        if (b.position === null) return -1
        return a.position - b.position
    })

    return positiveQuestions

}

async function getNegativeQuestions() {

    const paramsAndQuestions = await getParamsAndQuestions()
    const negativeQuestions = paramsAndQuestions.filter(param => !param.tree_question == 1)

    negativeQuestions.sort((a, b) => {
        if (a.position === null) return 1
        if (b.position === null) return -1
        return a.position - b.position
    })

    return negativeQuestions

}

async function renderPositiveQuestions() {

    const positiveQuestions = await getPositiveQuestions()
    let currentQuestionIndex = 0

    // Função para exibir a próxima pergunta
    async function showNextQuestion(element) {


        if (currentQuestionIndex >= positiveQuestions.length) {
            // Todas as perguntas foram respondidas
            alert("Todas as perguntas positivas foram renderizadas!")
            location.reload()
            return
        }

        const question = positiveQuestions[currentQuestionIndex]

        if (question.type_question === "binary") {

            await makeBinaryQuestion(
                currentQuestionIndex,
                question.title_question,
                question.question_description,
                question.option_one,
                question.option_two
            )

            // Aguarda a resposta do usuário antes de mostrar a próxima pergunta
            await waitForUserResponseBinaryQuestion()

            const elementQuestionFadeOut = $(`#${element}`)
    
            fadeComponents(elementQuestionFadeOut)
            currentQuestionIndex++

            setTimeout(() => {
    
                showNextQuestion(`component-${currentQuestionIndex}`)

            }, 600)
    

        } else if (question.type_question === "import") {
            // Lógica para perguntas do tipo "import"

            function handleImportInputChange() {

                setTimeout(function () {
                    showNextQuestion(`component-${currentQuestionIndex}`)
                }, 600)

            }

            const importData = question.import_type == 'department' ?  await getDepartments () : await getTopics () 

            await makeImportQuestion(
                
                currentQuestionIndex,
                question.question_description,
                importData,
                
            )

            const inputs = document.querySelectorAll(`#component-${currentQuestionIndex} input`);
            inputs.forEach((input) => {
                input.addEventListener('change', () => {

                    handleImportInputChange()
                    const elementQuestionFadeOut = $(`#${element}`)
                    fadeComponents(elementQuestionFadeOut)
                    currentQuestionIndex++
                })
                
            })

            

        } else if (question.type_question === "input") {
       
            // Lógica para perguntas do tipo "input"
            await makeFreeInputQuestion(
                currentQuestionIndex,
                question.question_description,
            )

            const buttonAdvanceInputQuestion = document.getElementById('input-free')
            buttonAdvanceInputQuestion.addEventListener('click', function () {
                setTimeout(function () {
                    setTimeout(function () {
                        showNextQuestion(`component-${currentQuestionIndex}`)
                    }, 600)
                    const elementQuestionFadeOut = $(`#${element}`)
                    fadeComponents(elementQuestionFadeOut)
                    currentQuestionIndex++
                }, 600)
            })

            
        }

    }

    // Inicia o processo mostrando a primeira pergunta
    showNextQuestion(`component-${currentQuestionIndex}`)

}

async function renderNegativeQuestions() {

    const negativeQuestions = await getNegativeQuestions()
    let currentQuestionIndex = 0

    // Função para exibir a próxima pergunta
    async function showNextQuestion(element) {

        if (currentQuestionIndex >= negativeQuestions.length) {
            // Todas as perguntas foram respondidas
            alert("Todas as perguntas negativas foram renderizadas!")
            location.reload()
            return
        }

        const question = negativeQuestions[currentQuestionIndex]

        if (question.type_question === "binary") {

            await makeBinaryQuestion(
                currentQuestionIndex,
                question.title_question,
                question.question_description,
                question.option_one,
                question.option_two
            )

            // Aguarda a resposta do usuário antes de mostrar a próxima pergunta
            await waitForUserResponseBinaryQuestion()

            const elementQuestionFadeOut = $(`#${element}`)
    
            fadeComponents(elementQuestionFadeOut)
            currentQuestionIndex++

            setTimeout(() => {
    
                showNextQuestion(`component-${currentQuestionIndex}`)

            }, 600)
    

        } else if (question.type_question === "import") {
            // Lógica para perguntas do tipo "import"

            function handleImportInputChange() {

                setTimeout(function () {
                    showNextQuestion(`component-${currentQuestionIndex}`)
                }, 600)

            }

            const importData = question.import_type == 'department' ?  await getDepartments () : await getTopics () 

            await makeImportQuestion(
                
                currentQuestionIndex,
                question.question_description,
                importData,
                
            )

            const inputs = document.querySelectorAll(`#component-${currentQuestionIndex} input`);
            inputs.forEach((input) => {
                input.addEventListener('change', () => {

                    handleImportInputChange()
                    const elementQuestionFadeOut = $(`#${element}`)
                    fadeComponents(elementQuestionFadeOut)
                    currentQuestionIndex++
                })
                
            })

            

        } else if (question.type_question === "input") {
       
            // Lógica para perguntas do tipo "input"
            await makeFreeInputQuestion(
                currentQuestionIndex,
                question.question_description,
            )

            const buttonAdvanceInputQuestion = document.getElementById(`component-${currentQuestionIndex}`)
            buttonAdvanceInputQuestion.addEventListener('click', function () {
                setTimeout(function () {
                    setTimeout(function () {
                        showNextQuestion(`component-${currentQuestionIndex}`)
                    }, 600)
                    const elementQuestionFadeOut = $(`#${element}`)
                    fadeComponents(elementQuestionFadeOut)
                    currentQuestionIndex++
                }, 600)
            })

            
        }

    }

    // Inicia o processo mostrando a primeira pergunta
    showNextQuestion(`component-${currentQuestionIndex}`)

}

async function makeFreeInputQuestion(index, bodyQuestion) {


    const questionElement = document.createElement("div")
    questionElement.id = `component-${index}`
    questionElement.classList.add(
        "input-group",
        "mt-8",
        "d-flex",
        "flex-column",
        "align-items-center"
    )

    questionElement.innerHTML = `
    <h3>${bodyQuestion}</h3>
    <input type="text" class="form-control w-75 rounded" />
    <input type="button" id="input-free" class="btn btn-secondary mt-4 rounded" value="AVANÇAR">
  `
    containerQuestions.appendChild(questionElement)

}

async function makeBinaryQuestion(index, titleQuestion, bodyQuestion, Option1, Option2) {

    const questionElement = document.createElement("div")
    questionElement.id = `component-${index}`
    questionElement.classList.add(
        "input-group",
        "mt-8",
        "d-flex",
        "flex-column",
        "align-items-center"
    )

    questionElement.innerHTML = `
      <h2 class="text-center">${titleQuestion}</h2>
      <h3>${bodyQuestion}</h3>
      <div class="btn-group-toggle text-center" data-toggle="buttons">
          <label class="btn btn-secondary btn-checkbox mr-2 btn-fixed-size">
              <input type="radio" name="option" value="option1">${Option1}
          </label>
          <label class="btn btn-secondary btn-checkbox mr-2 btn-fixed-size">
              <input type="radio" name="option" value="option2">${Option2}
          </label>
      </div>
    `

    containerQuestions.appendChild(questionElement)
}

async function makeImportQuestion(index, bodyQuestion, dataCheckBoxs) {
    
    const questionElement = document.createElement("div")
    questionElement.id = `component-${index}`
    questionElement.classList.add(
        "input-group",
        "mt-8",
        "d-flex",
        "flex-column",
        "align-items-center"
    );

    const headingElement = document.createElement("h3")
    headingElement.textContent = bodyQuestion

    questionElement.appendChild(headingElement)

    if (dataCheckBoxs instanceof HTMLElement) {
        questionElement.appendChild(dataCheckBoxs)
    }

    containerQuestions.appendChild(questionElement)
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
                    console.log("Opção 1 selecionada")
                    

                } else if (selectedValue === "option2") {
                    // Ação para a opção 2
                    console.log("Opção 2 selecionada")
                }

                resolve()
            })
        })
    })
}

async function createCheckboxList(departmentsOrTopics) {
    const container = document.createElement('div');
    container.style.display = 'inline-block';

    departmentsOrTopics.forEach((item) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = item.name;
        checkbox.value = item.id;
        checkbox.style.display = 'inline-block';

        const label = document.createElement('label');
        label.innerText = item.name;
        checkbox.style.marginRight = '5px';
        checkbox.style.marginLeft = '10px';
        label.style.display = 'inline-block';

        container.appendChild(checkbox);
        container.appendChild(label);
    })

    return container

}
