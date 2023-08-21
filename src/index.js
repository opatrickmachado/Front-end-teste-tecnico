document.addEventListener("DOMContentLoaded", function () {
    fetchProduto();
});

function fetchProduto() {
    fetch(
        "https://app.landingpage.com.br/Ajax/buscarDetalhesProdutoNuvemshop/LPL2gc/180064575"
    )
        .then((response) => {
            if (!response.ok) {
                throw new Error("Erro ao buscar os dados do produto");
            }
            return response.json();
        })
        .then((data) => {
            preencherDetalhesDoProduto(data);
            preencherVariantes(data);
            adicionarEventosDeEstoque(data);
            adicionarEventoDeCompra(data);
        })
        .catch((error) => {
            console.error("Houve um erro:", error);
        });
}

function preencherDetalhesDoProduto(data) {
    document.querySelector('[data-componente="titulo"]').innerText = data.title;
    document.querySelector('[data-componente="imagem"]').src = data.image_url;
    document.querySelector(
        '[data-componente="comparado"]'
    ).innerText = `R$${data.variants[0].price}`;
}

function preencherVariantes(data) {
    const variantesDiv = document.querySelector(".produtos-variantes");

    const uniqueValues = {};

    const uniqueOptions = [...new Set(data.options)];

    data.variants.forEach((variant) => {
        variant.values.forEach((value, index) => {
            const optionName = uniqueOptions[index];

            if (!uniqueValues[optionName]) {
                uniqueValues[optionName] = [];
            }

            if (!uniqueValues[optionName].includes(value)) {
                uniqueValues[optionName].push(value);
            }
        });
    });

    uniqueOptions.forEach((option) => {
        const div = document.createElement("div");
        div.classList.add("produto-select");

        const span = document.createElement("span");
        span.innerText = `${option}:`;
        div.appendChild(span);

        const select = document.createElement("select");

        uniqueValues[option].forEach((value) => {
            const optionElement = document.createElement("option");
            optionElement.value = value;
            optionElement.innerText = value;
            select.appendChild(optionElement);
        });

        div.appendChild(select);
        variantesDiv.appendChild(div);
    });
}

function getSelectedVariants() {
    const selects = document.querySelectorAll(".produto-select select");
    const selecionados = {};

    selects.forEach((select) => {
        const chave = select.previousElementSibling.innerText.slice(0, -1);
        selecionados[chave] = select.value;
    });

    return selecionados;
}

function checkStock(data, selectedVariants) {
    const variantInStock = data.variants.find((variant) => {
        return variant.values.every(
            (value, index) => value === selectedVariants[index]
        );
    });

    return variantInStock && variantInStock.inventory_quantity > 0;
}

function adicionarEventosDeEstoque(data) {
    const mensagemDiv = document.getElementById("mensagem");
    document.querySelectorAll(".produto-select select").forEach((select) => {
        select.addEventListener("change", () => {
            const combinacao = getSelectedVariants();
            const arrayCombinacao = Object.values(combinacao);
            if (checkStock(data, arrayCombinacao)) {
                mensagemDiv.innerText = "Produto em estoque!";
                mensagemDiv.style.color = "green";
            } else {
                mensagemDiv.innerText = "Produto fora de estoque!";
                mensagemDiv.style.color = "red";
            }
        });
    });
}

function adicionarEventoDeCompra(data) {
    const mensagemDiv = document.getElementById("mensagem");
    document.querySelector(".btn-comprar").addEventListener("click", () => {
        const selectedVariants = getSelectedVariants();
        const variantToBuy = data.variants.find((variant) => {
            return variant.values.every(
                (value, index) => value === selectedVariants[index]
            );
        });

        if (variantToBuy) {
            const dadosCheckout = [
                {
                    values: variantToBuy.values,
                    quantity: 1,
                    product_id: data.id,
                    variant_id: variantToBuy.id,
                },
            ];

            fetch(
                "https://app.landingpage.com.br/api/checkoutloja/LPL2gc/5d87eb644e5631bc6a03f1e43a804e1c",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(dadosCheckout),
                }
            )
                .then((response) => response.json())
                .then((result) => {
                    console.log("Success:", result);
                })
                .catch((error) => {
                    console.error("Error:", error);
                });
        } else {
            mensagemDiv.innerText = "Variante selecionada não está disponível.";
            mensagemDiv.style.color = "red";
        }
    });
}
