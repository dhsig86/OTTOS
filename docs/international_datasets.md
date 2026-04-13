# OTTO Atlas: International Datasets Strategy

Welcome to the Data Expansion Pipeline. This document tracks major international open-source or proprietary datasets that should be merged into OTTO's ML Pipeline to reinforce model accuracy, prevent bias, and expand capabilities.

## 1. Otoscopy2024 (MedMamba / Nature 2021)
- **Modality:** White-light Otoendoscopy.
- **Volume:** 22,581 classified images.
- **Classes:** 9 categories, directly overlapping with OTTO's core taxonomy:
  - Impacted cerumen
  - Normal eardrum
  - Chronic suppurative otitis media
  - Secretory otitis media
  - Otomycosis external
  - Tympanic membrane calcification
  - Cholesteatoma of middle ear
  - External auditory canal bleeding
  - Acute otitis media
- **Source:** Hospital of Shenzhen Baoan District, China.
- **Access Protocol:** Private dataset available upon request. 
- **Action Plan:** Send following email request to obtain access to the dataset link:

> **To:** zhenzhangli@gpnu.edu.cn (Dr. Zhenzhang Li)
> **Subject:** Data Request: Otoscopy2024 Dataset for Medical AI Research
> 
> Dear Dr. Zhenzhang Li and team,
> 
> I am writing to express our profound admiration for your advancements in medical image classification, notably the MedMamba architecture and your foundational 2021 Nature publication.
> I am the lead researcher/physician of the OTTO project, an Otoscopy ML Clinical Decision Support System. We are highly impressed by the scope of the **Otoscopy2024** dataset. Because our taxonomy directly mirrors your 9 classes, we would be honored to request academic access to the Otoscopy2024 dataset. We intend to use the dataset exclusively for academic and non-commercial research to fine-tune our models, and we will properly cite your work in any resulting outcomes.
> Thank you for your time.

---

## 2. DIOME (Dresden in vivo OCT Dataset of the Middle Ear)
- **Modality:** OCT (Optical Coherence Tomography) - Subsurface / Cross-sectional imaging.
- **Volume:** Specific structural mapping dataset.
- **Features:** Deep morphological labels, Semantic Segmentation masks, Sparse coordinate landmarks / Point clouds.
- **Mapped Structures:** Tympanic membrane, malleus, incus, stapes, cochlear promontory.
- **Access Protocol:** Open Access (CC-BY 4.0).
- **Links:** 
  - Data: https://opara.zih.tu-dresden.de/xmlui/handle/123456789/6047
  - Scripts/Gitlab: https://gitlab.com/nct_tso_public/diome
- **Strategic Value for OTTO 3.0 / 4.0:**
  - While OTTO currently classifies 2D visible light images (diagnosis), DIOME offers a 3D/Cross-sectional mapping of ear anatomy at a microscopic level. 
  - **Transfer Learning Potential:** We can use DIOME's pristine semantic masks of the malleus and incus to train a foundational *Anatomy Segmentation Model*. Once the AI learns the boundaries and 3D shapes of these ossicles from OCT, we can apply transfer learning techniques so the AI can "highlight" the same structures on normal 2D Otoscopies.
  - **Multimodality:** Allows OTTO to expand from a purely "Otoscopy Classifier" into a "Middle Ear Analysis Suite" capable of parsing high-tech OCT scans from large hospitals.
