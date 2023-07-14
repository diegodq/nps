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
}

function generateGradient(color) {
    const gradientScale = chroma.scale([color, chroma(color).darken(0.5)]).mode('lch')
    const gradientColors = gradientScale.colors(200)
    return gradientColors.map(color => chroma(color).css()).join(', ')
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

            setTimeout(() => {

                renderNegativeQuestions()

            }, 600)


        } else {

            fadeComponents(componentAnchorQuestion)

            setTimeout(() => {
                renderPositiveQuestions()


            }, 600)

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
        
        const allParams = await getParamsProduct()
        const bgColor = allParams.background_color
        const fontColor = allParams.font_color

        if (question.type_question === "binary") {
            
            await makeBinaryQuestion(
                currentQuestionIndex,
                question.title_question,
                question.question_description,
                question.option_one,
                question.option_two,
                generateGradient(fontColor),
                bgColor,
            )

            await waitForUserResponseBinaryQuestion()

            const elementQuestionFadeOut = $(`#${element}`)

            fadeComponents(elementQuestionFadeOut)
            currentQuestionIndex++

            setTimeout(() => {

                showNextQuestion(`component-${currentQuestionIndex}`)

            }, 600)


        } else if (question.type_question === "import") {
 
            function handleImportInputChange() {

                setTimeout(function () {
                    showNextQuestion(`component-${currentQuestionIndex}`)
                }, 600)

            }

            const importData = question.import_type == 'department' ? await getDepartments() : await getTopics()

            await makeImportQuestion(

                currentQuestionIndex,
                question.question_description,
                importData,

            )

            const labels = document.querySelectorAll(`#component-${currentQuestionIndex} label`);
            labels.forEach((label) => {
                label.addEventListener('click', () => {

                    handleImportInputChange()
                    const elementQuestionFadeOut = $(`#${element}`)
                    fadeComponents(elementQuestionFadeOut)
                    currentQuestionIndex++
                })

            })


        } else if (question.type_question === "input") {

    
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

        const allParams = await getParamsProduct()
        const bgColor = allParams.background_color
        const fontColor = allParams.font_color

        if (question.type_question === "binary") {

            await makeBinaryQuestion(
                currentQuestionIndex,
                question.title_question,
                question.question_description,
                question.option_one,
                question.option_two,
                generateGradient(fontColor),
                bgColor,
            )

            await waitForUserResponseBinaryQuestion()

            const elementQuestionFadeOut = $(`#${element}`)

            fadeComponents(elementQuestionFadeOut)
            currentQuestionIndex++

            setTimeout(() => {

                showNextQuestion(`component-${currentQuestionIndex}`)

            }, 600)


        } else if (question.type_question === "import") {
  

            function handleImportInputChange() {

                setTimeout(function () {
                    showNextQuestion(`component-${currentQuestionIndex}`)
                }, 600)

            }

            const importData = question.import_type == 'department' ? await getDepartments() : await getTopics()

            await makeImportQuestion(

                currentQuestionIndex,
                question.question_description,
                importData,

            )

            const labels = document.querySelectorAll(`#component-${currentQuestionIndex} label`);
            labels.forEach((label) => {
                label.addEventListener('click', () => {

                    handleImportInputChange()
                    const elementQuestionFadeOut = $(`#${element}`)
                    fadeComponents(elementQuestionFadeOut)
                    currentQuestionIndex++

                })

            })



        } else if (question.type_question === "input") {


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

    showNextQuestion(`component-${currentQuestionIndex}`)

}

async function makeFreeInputQuestion(index, bodyQuestion, borderColor) {
    const allParams = await getParamsProduct();
    const bgColor = allParams.background_color;
    const fontColor = allParams.font_color;
    const fontColorGradient = generateGradient(fontColor)
    
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
        <textarea class="form-control rounded" id="exampleTextarea" rows="3" style="width: 75vw; border-color: ${fontColor};"></textarea>
        <input type="button" id="input-free" class="btn mt-4 rounded" value="AVANÇAR" style="background: linear-gradient(to bottom right, ${fontColorGradient}); color: ${bgColor}">
    `;

    containerQuestions.appendChild(questionElement);
}

async function makeBinaryQuestion(index, titleQuestion, bodyQuestion, Option1, Option2, fontGradient, bgGradient) {
    const questionElement = document.createElement("div");
    questionElement.id = `component-${index}`;
    questionElement.classList.add(
        "input-group",
        "d-flex",
        "flex-column",
        "align-items-center"
    );

    questionElement.innerHTML = `
        <h2>${titleQuestion}</h2>
        <h3>${bodyQuestion}</h3>
        <div class="btn-group-toggle" data-toggle="buttons">
            <label class="btn mr-2 btn-fixed-size" style="background: linear-gradient(to bottom right, ${fontGradient}); color: ${bgGradient}">
                <input type="radio" name="option" value="option1">${Option1}
            </label>
            <label class="btn mr-2 btn-fixed-size" style="background: linear-gradient(to bottom right, ${fontGradient}); color: ${bgGradient}">
                <input type="radio" name="option" value="option2">${Option2}
            </label>
        </div>
    `;

    containerQuestions.appendChild(questionElement);
}

async function makeImportQuestion(index, bodyQuestion, dataCheckBoxs) {

    const questionElement = document.createElement("div")
    questionElement.id = `component-${index}`
    questionElement.classList.add(
        "input-group",
        "d-flex",
        "flex-column",
        "align-items-center"
    )
 
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
    });

    return container;
}


