import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  const { cnpj } = await params;
  const cleanCnpj = cnpj.replace(/\D/g, "");

  if (cleanCnpj.length !== 14) {
    return NextResponse.json({ error: "CNPJ deve ter 14 dígitos" }, { status: 400 });
  }

  try {
    // 1. Consulta ReceitaWS (dados da empresa)
    const receitaRes = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!receitaRes.ok) {
      return NextResponse.json({ error: "CNPJ não encontrado na Receita Federal" }, { status: 404 });
    }

    const receitaData = await receitaRes.json();

    if (receitaData.status === "ERROR") {
      return NextResponse.json({ error: receitaData.message || "CNPJ inválido" }, { status: 400 });
    }

    // 2. Se tem CEP, consulta ViaCEP para completar endereço
    let cepData = null;
    const cep = receitaData.cep?.replace(/\D/g, "");
    if (cep && cep.length === 8) {
      try {
        const cepRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
          signal: AbortSignal.timeout(5000),
        });
        if (cepRes.ok) {
          cepData = await cepRes.json();
        }
      } catch {}
    }

    // 3. Monta resposta normalizada
    const result = {
      name: receitaData.nome || receitaData.fantasia || "",
      taxId: receitaData.cnpj || "",
      address: receitaData.logradouro || (cepData?.logradouro || ""),
      number: receitaData.numero || "",
      complement: receitaData.complemento || (cepData?.complemento || ""),
      neighborhood: receitaData.bairro || (cepData?.bairro || ""),
      city: receitaData.municipio || (cepData?.localidade || ""),
      state: receitaData.uf || (cepData?.uf || ""),
      postalCode: receitaData.cep?.replace(/\D/g, "") || (cepData?.cep?.replace(/\D/g, "") || ""),
      phone: receitaData.telefone || "",
      email: receitaData.email || "",
      // Dados extras para exibição
      fantasia: receitaData.fantasia || "",
      situacao: receitaData.situacao || "",
      abertura: receitaData.abertura || "",
      natureza: receitaData.natureza_juridica || "",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CNPJ lookup] error:", error);
    return NextResponse.json({ error: "Erro ao consultar CNPJ. Tente novamente." }, { status: 500 });
  }
}