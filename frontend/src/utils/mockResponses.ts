import { ZONES } from '../constants';
import type { StructuredData } from '../components/StructuredDataCard';

interface AccessibilityNeeds {
  wheelchair: boolean;
  visual: boolean;
}

/**
 * Generates mock response for gate queries.
 */
function getMockGateResponse(
  lang: string,
  acc: AccessibilityNeeds,
  zoneLabel: string
): { reply: string; structuredData?: StructuredData } {
  if (acc.wheelchair) {
    if (lang === 'es') {
      return {
        reply: `Según su solicitud de asistencia en silla de ruedas en ${zoneLabel}, le recomendamos la Puerta A1. Cuenta con una rampa accesible dedicada y el tiempo de espera de la cola es actualmente Bajo.`,
        structuredData: {
          type: 'gate_recommendation',
          data: {
            gateName: 'Gate A1',
            distance: '75m',
            queueStatus: 'Low',
            accessible: true,
          },
        },
      };
    }
    if (lang === 'fr') {
      return {
        reply: `Selon vos besoins en fauteuil roulant à la ${zoneLabel}, nous vous recommandons la Porte A1. Elle dispose d'une rampe d'accès dédiée et le temps d'attente est actuellement Faible.`,
        structuredData: {
          type: 'gate_recommendation',
          data: {
            gateName: 'Gate A1',
            distance: '75m',
            queueStatus: 'Low',
            accessible: true,
          },
        },
      };
    }
    if (lang === 'ar') {
      return {
        reply: `بناءً على طلبك للكراسي المتحركة في ${zoneLabel}، نوصي بالبوابة A1. تحتوي على منحدر مخصص لذوي الاحتياجات الخاصة ووقت الانتظار قصير جداً حالياً.`,
        structuredData: {
          type: 'gate_recommendation',
          data: {
            gateName: 'Gate A1',
            distance: '75m',
            queueStatus: 'Low',
            accessible: true,
          },
        },
      };
    }
    return {
      reply: `Based on your wheelchair accessibility profile at ${zoneLabel}, I recommend Gate A1. It has a dedicated ramp and the queue is currently Low (under 3 min wait).`,
      structuredData: {
        type: 'gate_recommendation',
        data: {
          gateName: 'Gate A1',
          distance: '75m',
          queueStatus: 'Low',
          accessible: true,
        },
      },
    };
  }

  // Standard gate recommendation
  if (lang === 'es') {
    return {
      reply: `La puerta más cercana a su zona (${zoneLabel}) es la Puerta B3. Hay una cola moderada con una espera estimada de 10 minutos.`,
      structuredData: {
        type: 'gate_recommendation',
        data: {
          gateName: 'Gate B3',
          distance: '130m',
          queueStatus: 'Medium',
          accessible: false,
        },
      },
    };
  }
  if (lang === 'fr') {
    return {
      reply: `La porte la plus proche de votre zone (${zoneLabel}) est la Porte B3. Il y a une file d'attente modérée avec une attente estimée de 10 minutes.`,
      structuredData: {
        type: 'gate_recommendation',
        data: {
          gateName: 'Gate B3',
          distance: '130m',
          queueStatus: 'Medium',
          accessible: false,
        },
      },
    };
  }
  if (lang === 'ar') {
    return {
      reply: `البوابة الأقرب إلى منطقتك (${zoneLabel}) هي البوابة B3. هناك طابور متوسط مع وقت انتظار يقدر بـ 10 دقائق.`,
      structuredData: {
        type: 'gate_recommendation',
        data: {
          gateName: 'Gate B3',
          distance: '130m',
          queueStatus: 'Medium',
          accessible: false,
        },
      },
    };
  }
  return {
    reply: `The closest gate to your location in ${zoneLabel} is Gate B3. Note that queue wait time is Medium (approx. 10 mins).`,
    structuredData: {
      type: 'gate_recommendation',
      data: {
        gateName: 'Gate B3',
        distance: '130m',
        queueStatus: 'Medium',
        accessible: false,
      },
    },
  };
}

/**
 * Generates mock response for transport queries.
 */
function getMockTransportResponse(
  lang: string,
  acc: AccessibilityNeeds,
  zoneLabel: string
): { reply: string; structuredData?: StructuredData } {
  const options = [
    { mode: 'train', line: 'Metro Line 1 (Stadium South)', eta: '3 mins' },
    { mode: 'bus', line: 'Express Shuttle 501', eta: '7 mins' },
  ];
  if (acc.wheelchair) {
    options.push({
      mode: 'shuttle',
      line: 'ADA Cart Shuttle',
      eta: '4 mins',
    });
  }

  if (lang === 'es') {
    return {
      reply: `Aquí están las opciones de transporte disponibles desde ${zoneLabel}. El metro es el más rápido, y disponemos de un carrito de golf ADA si requiere asistencia directa.`,
      structuredData: { type: 'transport_options', data: { options } },
    };
  }
  if (lang === 'fr') {
    return {
      reply: `Voici les options de transport disponibles depuis la ${zoneLabel}. Le métro est le plus rapide, et une navette ADA est disponible si vous avez besoin d'assistance.`,
      structuredData: { type: 'transport_options', data: { options } },
    };
  }
  if (lang === 'ar') {
    return {
      reply: `إليك خيارات النقل المتاحة من ${zoneLabel}. المترو هو الأسرع، وهناك عربة جولف مخصصة لذوي الاحتياجات الخاصة متاحة عند الطلب.`,
      structuredData: { type: 'transport_options', data: { options } },
    };
  }
  return {
    reply: `Here are the transit lines servicing ${zoneLabel}. Metro Line 1 is the fastest option. Accessible shuttle carts are standing by.`,
    structuredData: { type: 'transport_options', data: { options } },
  };
}

/**
 * Generates mock response for crowd queries.
 */
function getMockCrowdResponse(
  lang: string,
  zoneId: string,
  zoneLabel: string
): { reply: string; structuredData?: StructuredData } {
  const isHigh = zoneId === 'zone_c' || zoneId === 'zone_b';
  const density = isHigh ? '85%' : '40%';
  const status = isHigh ? 'Busy' : 'Normal';

  if (lang === 'es') {
    return {
      reply: `La densidad de público actual en la ${zoneLabel} es del ${density} (${status === 'Busy' ? 'Concurrido' : 'Normal'}). El flujo de personas es constante.`,
      structuredData: {
        type: 'crowd_density',
        data: {
          zone: zoneId,
          density,
          status: isHigh ? 'Busy' : 'Normal',
        },
      },
    };
  }
  if (lang === 'fr') {
    return {
      reply: `La densité de foule actuelle dans la ${zoneLabel} is de ${density} (${status === 'Busy' ? 'Bondé' : 'Normal'}). La circulation reste fluide.`,
      structuredData: {
        type: 'crowd_density',
        data: {
          zone: zoneId,
          density,
          status: isHigh ? 'Busy' : 'Normal',
        },
      },
    };
  }
  if (lang === 'ar') {
    return {
      reply: `كثافة الجمهور الحالية في ${zoneLabel} هي ${density} (${status === 'Busy' ? 'مزدحم' : 'طبيعي'}). تدفق الجمهور مستقر حتى الآن.`,
      structuredData: {
        type: 'crowd_density',
        data: {
          zone: zoneId,
          density,
          status: isHigh ? 'Busy' : 'Normal',
        },
      },
    };
  }
  return {
    reply: `Current crowd density in ${zoneLabel} is ${density} (${status}). Movement is fluid, but consider alternative corridors to avoid lines.`,
    structuredData: {
      type: 'crowd_density',
      data: { zone: zoneId, density, status },
    },
  };
}

/**
 * Generates fallback / welcome mock response.
 */
function getMockDefaultResponse(lang: string): { reply: string } {
  if (lang === 'es') {
    return {
      reply:
        '¡Hola! Soy su asistente inteligente del estadio para el Mundial FIFA 2026. Pregúnteme sobre la puerta más cercana, el transporte o la densidad de público en su zona.',
    };
  }
  if (lang === 'fr') {
    return {
      reply:
        "Bonjour! Je suis votre concierge intelligent de la Coupe du Monde de la FIFA 2026. N'hésitez pas à me demander des directions de portes, les transports ou la densité de foule.",
    };
  }
  if (lang === 'ar') {
    return {
      reply:
        'مرحباً! أنا المساعد الذكي لكأس العالم لكرة القدم 2026. يمكنك الاستفسار عن أقرب بوابة، خيارات النقل، أو حالة الازدحام في منطقتك.',
    };
  }
  return {
    reply:
      'Hello! I am your FIFA World Cup 2026 Smart Stadium Concierge. Ask me about gates, transportation, accessibility routes, or crowd density in your zone.',
  };
}

/**
 * Generates a mock response for offline/demonstration mode based on message text,
 * language, accessibility settings, and zone ID.
 *
 * @param text The input message text from the user.
 * @param lang The user's preferred language ('en', 'es', etc.).
 * @param acc The accessibility settings object.
 * @param zoneId The zone ID where the user is currently located.
 * @returns An object containing the text reply and optional structured data.
 */
export const getMockResponse = (
  text: string,
  lang: string,
  acc: AccessibilityNeeds,
  zoneId: string
): { reply: string; structuredData?: StructuredData } => {
  const cleanText = text.toLowerCase();
  const zoneLabel = ZONES.find((z) => z.id === zoneId)?.label || zoneId;

  if (
    cleanText.includes('gate') ||
    cleanText.includes('entrance') ||
    cleanText.includes('puerta') ||
    cleanText.includes('porte') ||
    cleanText.includes('بوابة')
  ) {
    return getMockGateResponse(lang, acc, zoneLabel);
  }

  if (
    cleanText.includes('transport') ||
    cleanText.includes('bus') ||
    cleanText.includes('train') ||
    cleanText.includes('shuttle') ||
    cleanText.includes('metro') ||
    cleanText.includes('قطار') ||
    cleanText.includes('حافلة')
  ) {
    return getMockTransportResponse(lang, acc, zoneLabel);
  }

  if (
    cleanText.includes('crowd') ||
    cleanText.includes('busy') ||
    cleanText.includes('density') ||
    cleanText.includes('people') ||
    cleanText.includes('زدحام')
  ) {
    return getMockCrowdResponse(lang, zoneId, zoneLabel);
  }

  return getMockDefaultResponse(lang);
};
