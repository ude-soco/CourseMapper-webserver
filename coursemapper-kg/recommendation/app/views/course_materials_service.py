from flask import Blueprint, request, jsonify, make_response, copy_current_request_context
import logging
from log import LOG
import time

from ..services.course_materials.recommendation.resource_recommender import ResourceRecommenderService
from ..services.course_materials.kwp_extraction.dbpedia.data_service1 import RecService
from ..services.course_materials.GCN.gcn import GCN


logger = LOG(name=__name__, level=logging.DEBUG)
course_materials = Blueprint("course_materials", __name__)


def is_client_connected():
    return not request.is_json


@course_materials.route("/get_concepts", methods=["POST"])
def get_concepts():
    # return make_response([], 200)
    data = request.get_json()
    material_id = data.get("materialId")  # type: ignore
    material_page = data.get("materialPage")  # type: ignore
    user_id = data.get("userId")  # type: ignore
    user_email = data.get("userEmail")  # type: ignore
    username = data.get("username")  # type: ignore
    understood = data.get("understoodConcepts")  # type: ignore
    non_understood = data.get("nonUnderstoodConcepts")  # type: ignore
    new_concepts = data.get("newConcepts")  # type: ignore

    # print("not-understood from Yipeng:", non_understood, flush=True)
    understood = [cid for cid in understood.split(",") if understood]
    non_understood = [cid for cid in non_understood.split(",") if non_understood]
    new_concepts = [cid for cid in new_concepts.split(",") if new_concepts]
    material_id = material_id.split("-")[0]
    slide_id = str(material_id) + "_slide_" + str(material_page)

    return CRO_TEST_get_concepts

    print(
        "material_id:",
        material_id,
        "page: ",
        material_page,
        "slide_id: ",
        slide_id,
        "user_id: ",
        user_id,
        "user_email: ",
        user_email,
        "username: ",
        username,
        "understood: ",
        understood,
        "nonUnderstood: ",
        non_understood,
        "new_concepts: ",
        new_concepts,
        flush=True,
    )
    start_time1 = time.time()
    start_time = time.time()
    data_service = RecService()
    end_time = time.time()
    print("Get RecService time: ", end_time - start_time, flush=True)
    # start_time = time.time()
    # # get related concepts and category of concepts user doesn't understand
    # # data_service._get_related_category(ids=non_understood, mid=material_id)
    # end_time = time.time()
    # print('Get the related concepts and category Execution time: ', end_time - start_time, flush=True)
    # use GCN to get final embedding of each node
    start_time = time.time()
    data_service._extract_vector_relation(mid=material_id)
#    logger.info("GCN")
    gcn = GCN()
    gcn.load_data()
    end_time = time.time()
    print("use gcn Execution time: ", end_time - start_time, flush=True)

    start_time = time.time()
    user = {"name": username, "id": user_id, "user_email": user_email}
    data_service._construct_user(
        user_id=user_id,
        non_understood=non_understood,
        understood=understood,
        new_concepts=new_concepts,
        mid=material_id,
    )
    end_time = time.time()
    print("Get User model Execution time: ", end_time - start_time, flush=True)

    start_time = time.time()
    # Get top-5 recommendation concept and interpretability
    resp = data_service._get_concept_recommendation(user_id=user_id, mid=material_id)
    end_time = time.time()

    print(
        "Get top-5 recommendation concept and interpretability Execution time: ",
        end_time - start_time,
        flush=True,
    )
    end_time1 = time.time()
    print("Execution time: ", end_time1 - start_time1, flush=True)
    #make_response.headers.add('Access-Control-Allow-Origin', '*')

    return make_response(resp, 200)


@course_materials.route("/get_resources", methods=["POST"])
def get_resources():
    data = request.get_json()

    # return jsonify(cro_get_resources_pagination()), 200
    # time.sleep(60*2)
    
    resource_recommender_service = ResourceRecommenderService()
    result = resource_recommender_service._get_resources(data_default=data["default"], data_rec_params=data["rec_params"])
    
    return jsonify(result), 200



## boby024
CRO_TEST_get_concepts = {
}

def cro_get_resources_pagination():
    data = {
        "concepts": [
            {
                "cid": "8458307499547602548",
                "name": "Machine learning",
                "status": True,
                "visible": True,
                "weight": 0.77
            },
            {
                "cid": "2156985142238936538",
                "name": "Learning analytics",
                "status": True,
                "visible": True,
                "weight": 0.79
            }
        ],
        "nodes": {
            "articles": {
                "current_page": 1,
                "total_pages": 2,
                "total_items": 10,
                "content":             [
                {
                    "abstract": "Dragan Gašević is Professor of Learning Analytics at Monash University. He is a researcher in learning analytics and co-developed several software systems such as P3, rBPMN Editor, LOCO-Analyst, OnTask, OVAL, and ProSolo. He is recognized as Australia's field leader in educational technologies.",
                    "saves_count": 0,
                    "channel_title": None,
                    "description": None,
                    "description_full": None,
                    "duration": None,
                    "helpful_count": 0,
                    "id": 39,
                    "is_bookmarked_fill": False,
                    "like_count": None,
                    "not_helpful_count": 0,
                    "publish_time": None,
                    "rid": "https://en.wikipedia.org/wiki/Dragan_Gasevic",
                    "similarity_score": 0.9228699207305908,
                    "text": "Dragan Gasevic. Dragan Gašević is Professor of Learning Analytics at Monash University. He is a researcher in learning analytics and co-developed several software systems such as P3, rBPMN Editor, LOCO-Analyst, OnTask, OVAL, and ProSolo. He is recognized as Australia's field leader in educational technologies.",
                    "thumbnail": None,
                    "title": "Dragan Gasevic",
                    "updated_at": "2024-08-02T17:27:57.524875",
                    "uri": "https://en.wikipedia.org/wiki/Dragan_Gasevic",
                    "views": None
                },
                {
                    "abstract": "Adversarial machine learning is the study of the attacks on machine learning algorithms, and of the defenses against such attacks. A survey from May 2020 exposes the fact that practitioners report a dire need for better protecting machine learning systems in industrial applications.\nMost machine learning techniques are mostly designed to work on specific problem sets, under the assumption that the training and test data are generated from the same statistical distribution (IID). However, this assumption is often dangerously violated in practical high-stake applications, where users may intentionally supply fabricated data that violates the statistical assumption.\nMost common attacks in adversarial machine learning include evasion attacks, data poisoning attacks, Byzantine attacks and model extraction.\n\n",
                    "saves_count": 0,
                    "channel_title": None,
                    "description": None,
                    "description_full": None,
                    "duration": None,
                    "helpful_count": 0,
                    "id": 45,
                    "is_bookmarked_fill": False,
                    "like_count": None,
                    "not_helpful_count": 0,
                    "publish_time": None,
                    "rid": "https://en.wikipedia.org/wiki/Adversarial_machine_learning",
                    "similarity_score": 0.9107425808906555,
                    "text": "Adversarial machine learning. Adversarial machine learning is the study of the attacks on machine learning algorithms, and of the defenses against such attacks. A survey from May 2020 exposes the fact that practitioners report a dire need for better protecting machine learning systems in industrial applications.\nMost machine learning techniques are mostly designed to work on specific problem sets, under the assumption that the training and test data are generated from the same statistical distribution (IID). However, this assumption is often dangerously violated in practical high-stake applications, where users may intentionally supply fabricated data that violates the statistical assumption.\nMost common attacks in adversarial machine learning include evasion attacks, data poisoning attacks, Byzantine attacks and model extraction.\n\n",
                    "thumbnail": None,
                    "title": "Adversarial machine learning",
                    "updated_at": "2024-08-05T19:59:05.128980",
                    "uri": "https://en.wikipedia.org/wiki/Adversarial_machine_learning",
                    "views": None
                },
                {
                    "abstract": "Analysis (pl.: analyses) is the process of breaking a complex topic or substance into smaller parts in order to gain a better understanding of it. The technique has been applied in the study of mathematics and logic since before Aristotle (384–322 B.C.), though analysis as a formal concept is a relatively recent development.\nThe word comes from the Ancient Greek ἀνάλυσις (analysis, \"a breaking-up\" or \"an untying;\" from ana- \"up, throughout\" and lysis \"a loosening\"). From it also comes the word's plural, analyses.\nAs a formal concept, the method has variously been ascribed to René Descartes (Discourse on the Method), and Galileo Galilei. It has also been ascribed to Isaac Newton, in the form of a practical method of physical discovery (which he did not name).\nThe converse of analysis is synthesis: putting the pieces back together again in a new or different whole.",
                    "saves_count": 0,
                    "channel_title": None,
                    "description": None,
                    "description_full": None,
                    "duration": None,
                    "helpful_count": 0,
                    "id": 37,
                    "is_bookmarked_fill": False,
                    "like_count": None,
                    "not_helpful_count": 0,
                    "publish_time": None,
                    "rid": "https://en.wikipedia.org/wiki/Analysis",
                    "similarity_score": 0.9070759415626526,
                    "text": "Analytics. Analysis (pl.: analyses) is the process of breaking a complex topic or substance into smaller parts in order to gain a better understanding of it. The technique has been applied in the study of mathematics and logic since before Aristotle (384–322 B.C.), though analysis as a formal concept is a relatively recent development.\nThe word comes from the Ancient Greek ἀνάλυσις (analysis, \"a breaking-up\" or \"an untying;\" from ana- \"up, throughout\" and lysis \"a loosening\"). From it also comes the word's plural, analyses.\nAs a formal concept, the method has variously been ascribed to René Descartes (Discourse on the Method), and Galileo Galilei. It has also been ascribed to Isaac Newton, in the form of a practical method of physical discovery (which he did not name).\nThe converse of analysis is synthesis: putting the pieces back together again in a new or different whole.",
                    "thumbnail": None,
                    "title": "Analytics",
                    "updated_at": "2024-08-02T17:27:57.494861",
                    "uri": "https://en.wikipedia.org/wiki/Analysis",
                    "views": None
                },
                {
                    "abstract": "Learning analytics is the measurement, collection, analysis and reporting of data about learners and their contexts, for purposes of understanding and optimizing learning and the environments in which it occurs.\nThe growth of online learning since the 1990s, particularly in higher education, has contributed to the advancement of Learning Analytics as student data can be captured and made available for analysis. When learners use an LMS, social media, or similar online tools, their clicks, navigation patterns, time on task, social networks, information flow, and concept development through discussions can be tracked. The rapid development of massive open online courses (MOOCs) offers additional data for researchers to evaluate teaching and learning in online environments.\n\n",
                    "saves_count": 0,
                    "channel_title": None,
                    "description": None,
                    "description_full": None,
                    "duration": None,
                    "helpful_count": 0,
                    "id": 36,
                    "is_bookmarked_fill": False,
                    "like_count": None,
                    "not_helpful_count": 0,
                    "publish_time": None,
                    "rid": "https://en.wikipedia.org/wiki/Learning_analytics",
                    "similarity_score": 0.8936335444450378,
                    "text": "Learning analytics. Learning analytics is the measurement, collection, analysis and reporting of data about learners and their contexts, for purposes of understanding and optimizing learning and the environments in which it occurs.\nThe growth of online learning since the 1990s, particularly in higher education, has contributed to the advancement of Learning Analytics as student data can be captured and made available for analysis. When learners use an LMS, social media, or similar online tools, their clicks, navigation patterns, time on task, social networks, information flow, and concept development through discussions can be tracked. The rapid development of massive open online courses (MOOCs) offers additional data for researchers to evaluate teaching and learning in online environments.\n\n",
                    "thumbnail": None,
                    "title": "Learning analytics",
                    "updated_at": "2024-08-02T17:27:57.479377",
                    "uri": "https://en.wikipedia.org/wiki/Learning_analytics",
                    "views": None
                },
                {
                    "abstract": "The machine learning-based attention method simulates how human attention works by assigning varying levels of importance to different components of a sequence. In natural language processing, this usually means assigning different levels of importance to different words in a sentence. It assigns importance to each word by calculating \"soft\" weights for the word's numerical representation, known as its embedding, within a specific section of the sentence called the context window to determine its importance. The calculation of these weights can occur simultaneously in models called transformers, or one by one in models known as recurrent neural networks. Unlike \"hard\" weights, which are predetermined and fixed during training, \"soft\" weights can adapt and change with each use of the model.\nAttention was developed to address the weaknesses of leveraging information from the hidden layers of recurrent neural networks. Recurrent neural networks favor more recent information contained in words at the end of a sentence, while information earlier in the sentence tends to be attenuated. Attention allows the calculation of the hidden representation of a token equal access to any part of a sentence directly, rather than only through the previous hidden state.  \nEarlier uses attached this mechanism to a serial recurrent neural network's language translation system (below), but later uses in transformers' large language models removed the recurrent neural network and relied heavily on the faster parallel attention scheme.\n\n",
                    "saves_count": 0,
                    "channel_title": None,
                    "description": None,
                    "description_full": None,
                    "duration": None,
                    "helpful_count": 0,
                    "id": 44,
                    "is_bookmarked_fill": False,
                    "like_count": None,
                    "not_helpful_count": 0,
                    "publish_time": None,
                    "rid": "https://en.wikipedia.org/wiki/Attention_(machine_learning)",
                    "similarity_score": 0.8892121911048889,
                    "text": "Attention (machine learning). The machine learning-based attention method simulates how human attention works by assigning varying levels of importance to different components of a sequence. In natural language processing, this usually means assigning different levels of importance to different words in a sentence. It assigns importance to each word by calculating \"soft\" weights for the word's numerical representation, known as its embedding, within a specific section of the sentence called the context window to determine its importance. The calculation of these weights can occur simultaneously in models called transformers, or one by one in models known as recurrent neural networks. Unlike \"hard\" weights, which are predetermined and fixed during training, \"soft\" weights can adapt and change with each use of the model.\nAttention was developed to address the weaknesses of leveraging information from the hidden layers of recurrent neural networks. Recurrent neural networks favor more recent information contained in words at the end of a sentence, while information earlier in the sentence tends to be attenuated. Attention allows the calculation of the hidden representation of a token equal access to any part of a sentence directly, rather than only through the previous hidden state.  \nEarlier uses attached this mechanism to a serial recurrent neural network's language translation system (below), but later uses in transformers' large language models removed the recurrent neural network and relied heavily on the faster parallel attention scheme.\n\n",
                    "thumbnail": None,
                    "title": "Attention (machine learning)",
                    "updated_at": "2024-08-05T19:59:05.119531",
                    "uri": "https://en.wikipedia.org/wiki/Attention_(machine_learning)",
                    "views": None
                },
                {
                    "abstract": "A learning management system (LMS) or virtual learning environment (VLE) is a software application for the administration, documentation, tracking, reporting, automation, and delivery of educational courses, training programs, materials or learning and development programs. The learning management system concept emerged directly from e-Learning.  Learning management systems make up the largest segment of the learning system market. The first introduction of the LMS was in the late 1990s. LMSs have been adopted by almost all higher education institutions in the English-speaking world. Learning management systems have faced a massive growth in usage due to the emphasis on remote learning during the COVID-19 pandemic.\nLearning management systems were designed to identify training and learning gaps, using analytical data and reporting. LMSs are focused on online learning delivery but support a range of uses, acting as a platform for online content, including courses, both asynchronous based and synchronous based. In the higher education space, an LMS may offer classroom management for instructor-led training or a flipped classroom. Modern LMSs include intelligent algorithms to make automated recommendations for courses based on a user's skill profile as well as extract metadata from learning materials to make such recommendations even more accurate.\n\n",
                    "saves_count": 0,
                    "channel_title": None,
                    "description": None,
                    "description_full": None,
                    "duration": None,
                    "helpful_count": 0,
                    "id": 38,
                    "is_bookmarked_fill": False,
                    "like_count": 2,
                    "not_helpful_count": 0,
                    "publish_time": None,
                    "rid": "https://en.wikipedia.org/wiki/Learning_management_system",
                    "similarity_score": 0.8786301612854004,
                    "text": "Learning management system. A learning management system (LMS) or virtual learning environment (VLE) is a software application for the administration, documentation, tracking, reporting, automation, and delivery of educational courses, training programs, materials or learning and development programs. The learning management system concept emerged directly from e-Learning.  Learning management systems make up the largest segment of the learning system market. The first introduction of the LMS was in the late 1990s. LMSs have been adopted by almost all higher education institutions in the English-speaking world. Learning management systems have faced a massive growth in usage due to the emphasis on remote learning during the COVID-19 pandemic.\nLearning management systems were designed to identify training and learning gaps, using analytical data and reporting. LMSs are focused on online learning delivery but support a range of uses, acting as a platform for online content, including courses, both asynchronous based and synchronous based. In the higher education space, an LMS may offer classroom management for instructor-led training or a flipped classroom. Modern LMSs include intelligent algorithms to make automated recommendations for courses based on a user's skill profile as well as extract metadata from learning materials to make such recommendations even more accurate.\n\n",
                    "thumbnail": None,
                    "title": "Learning management system",
                    "updated_at": "2024-08-02T17:27:57.508201",
                    "uri": "https://en.wikipedia.org/wiki/Learning_management_system",
                    "views": None
                },
                {
                    "abstract": "Quantum machine learning is the integration of quantum algorithms within machine learning programs.\nThe most common use of the term refers to machine learning algorithms for the analysis of classical data executed on a quantum computer, i.e. quantum-enhanced machine learning. While machine learning algorithms are used to compute immense quantities of data, quantum machine learning utilizes qubits and quantum operations or specialized quantum systems to improve computational speed and data storage done by algorithms in a program. This includes hybrid methods that involve both classical and quantum processing, where computationally difficult subroutines are outsourced to a quantum device. These routines can be more complex in nature and executed faster on a quantum computer. Furthermore, quantum algorithms can be used to analyze quantum states instead of classical data.\nBeyond quantum computing, the term \"quantum machine learning\" is also associated with classical machine learning methods applied to data generated from quantum experiments (i.e. machine learning of quantum systems), such as learning the phase transitions of a quantum system or creating new quantum experiments.\nQuantum machine learning also extends to a branch of research that explores methodological and structural similarities between certain physical systems and learning systems, in particular neural networks. For example, some mathematical and numerical techniques from quantum physics are applicable to classical deep learning and vice versa.\nFurthermore, researchers investigate more abstract notions of learning theory with respect to quantum information, sometimes referred to as \"quantum learning theory\".\n\n",
                    "saves_count": 0,
                    "channel_title": None,
                    "description": None,
                    "description_full": None,
                    "duration": None,
                    "helpful_count": 10,
                    "id": 42,
                    "is_bookmarked_fill": False,
                    "like_count": None,
                    "not_helpful_count": 0,
                    "publish_time": None,
                    "rid": "https://en.wikipedia.org/wiki/Quantum_machine_learning",
                    "similarity_score": 0.8500010967254639,
                    "text": "Quantum machine learning. Quantum machine learning is the integration of quantum algorithms within machine learning programs.\nThe most common use of the term refers to machine learning algorithms for the analysis of classical data executed on a quantum computer, i.e. quantum-enhanced machine learning. While machine learning algorithms are used to compute immense quantities of data, quantum machine learning utilizes qubits and quantum operations or specialized quantum systems to improve computational speed and data storage done by algorithms in a program. This includes hybrid methods that involve both classical and quantum processing, where computationally difficult subroutines are outsourced to a quantum device. These routines can be more complex in nature and executed faster on a quantum computer. Furthermore, quantum algorithms can be used to analyze quantum states instead of classical data.\nBeyond quantum computing, the term \"quantum machine learning\" is also associated with classical machine learning methods applied to data generated from quantum experiments (i.e. machine learning of quantum systems), such as learning the phase transitions of a quantum system or creating new quantum experiments.\nQuantum machine learning also extends to a branch of research that explores methodological and structural similarities between certain physical systems and learning systems, in particular neural networks. For example, some mathematical and numerical techniques from quantum physics are applicable to classical deep learning and vice versa.\nFurthermore, researchers investigate more abstract notions of learning theory with respect to quantum information, sometimes referred to as \"quantum learning theory\".\n\n",
                    "thumbnail": None,
                    "title": "Quantum machine learning",
                    "updated_at": "2024-08-05T19:59:05.068861",
                    "uri": "https://en.wikipedia.org/wiki/Quantum_machine_learning",
                    "views": None
                },
                {
                    "abstract": "In machine learning, a neural network (also artificial neural network or neural net, abbreviated ANN or NN) is a model inspired by the structure and function of biological neural networks in animal brains.\nAn ANN consists of connected units or nodes called artificial neurons, which loosely model the neurons in a brain. These are connected by edges, which model the synapses in a brain. Each artificial neuron receives signals from connected neurons, then processes them and sends a signal to other connected neurons. The \"signal\" is a real number, and the output of each neuron is computed by some non-linear function of the sum of its inputs, called the activation function. The strength of the signal at each connection is determined by a weight, which adjusts during the learning process.\nTypically, neurons are aggregated into layers. Different layers may perform different transformations on their inputs. Signals travel from the first layer (the input layer) to the last layer (the output layer), possibly passing through multiple intermediate layers (hidden layers). A network is typically called a deep neural network if it has at least 2 hidden layers.\nArtificial neural networks are used for various tasks, including predictive modeling, adaptive control, and solving problems in artificial intelligence. They can learn from experience, and can derive conclusions from a complex and seemingly unrelated set of information.\n\n",
                    "saves_count": 0,
                    "channel_title": None,
                    "description": None,
                    "description_full": None,
                    "duration": None,
                    "helpful_count": 0,
                    "id": 43,
                    "is_bookmarked_fill": False,
                    "like_count": None,
                    "not_helpful_count": 0,
                    "publish_time": None,
                    "rid": "https://en.wikipedia.org/wiki/Neural_network_(machine_learning)",
                    "similarity_score": 0.8430169224739075,
                    "text": "Neural network (machine learning). In machine learning, a neural network (also artificial neural network or neural net, abbreviated ANN or NN) is a model inspired by the structure and function of biological neural networks in animal brains.\nAn ANN consists of connected units or nodes called artificial neurons, which loosely model the neurons in a brain. These are connected by edges, which model the synapses in a brain. Each artificial neuron receives signals from connected neurons, then processes them and sends a signal to other connected neurons. The \"signal\" is a real number, and the output of each neuron is computed by some non-linear function of the sum of its inputs, called the activation function. The strength of the signal at each connection is determined by a weight, which adjusts during the learning process.\nTypically, neurons are aggregated into layers. Different layers may perform different transformations on their inputs. Signals travel from the first layer (the input layer) to the last layer (the output layer), possibly passing through multiple intermediate layers (hidden layers). A network is typically called a deep neural network if it has at least 2 hidden layers.\nArtificial neural networks are used for various tasks, including predictive modeling, adaptive control, and solving problems in artificial intelligence. They can learn from experience, and can derive conclusions from a complex and seemingly unrelated set of information.\n\n",
                    "thumbnail": None,
                    "title": "Neural network (machine learning)",
                    "updated_at": "2024-08-05T19:59:05.110470",
                    "uri": "https://en.wikipedia.org/wiki/Neural_network_(machine_learning)",
                    "views": None
                }
            ],
            
            },
            "videos": {
                "current_page": 1,
                "total_pages": 2,
                "total_items": 10,
                "content":             [
                {
                    "abstract": None,
                    "saves_count": 5,
                    "channel_title": "IBM Technology",
                    "description": "Learn more about watsonx: https://ibm.biz/BdvxDS What is really the difference between Artificial intelligence (AI) and machine ...",
                    "description_full": "Learn more about watsonx: https://ibm.biz/BdvxDS\n\nWhat is really the difference between Artificial intelligence (AI) and machine learning (ML)? Are they actually the same thing? In this video, Jeff Crume explains the differences and relationship between AI & ML, as well as how related topics like Deep Learning (DL) and other types and properties of each.\n\n#ai #ml #dl #artificialintelligence #machinelearning #deeplearning #watsonx",
                    "duration": "5:49",
                    "helpful_count": 10,
                    "id": 27,
                    "is_bookmarked_fill": False,
                    "like_count": 31972,
                    "not_helpful_count": 0,
                    "publish_time": "2023-04-10T11:00:03Z",
                    "rid": "4RixMPF4xis",
                    "similarity_score": 0.9154770374298096,
                    "text": "ai vs machine learning. learn more about watsonx: https://ibm.biz/bdvxds what is really the difference between artificial intelligence (ai) and machine ...",
                    "thumbnail": "https://i.ytimg.com/vi/4RixMPF4xis/hqdefault.jpg",
                    "title": "AI vs Machine Learning",
                    "updated_at": "2024-08-05T19:59:04.778389",
                    "uri": "https://www.youtube.com/embed/4RixMPF4xis?autoplay=1",
                    "views": 1059536
                },
                {
                    "abstract": None,
                    "saves_count": 3,
                    "channel_title": "Simplilearn",
                    "description": "Professional Certificate Course In AI And Machine Learning by IIT Kanpur (India Only): ...",
                    "description_full": "🔥Professional Certificate Course In AI And Machine Learning by IIT Kanpur (India Only): https://www.simplilearn.com/iitk-professional-certificate-course-ai-machine-learning?utm_campaign=23AugustTubebuddyExpPCPAIandML&utm_medium=DescriptionFF&utm_source=youtube\n🔥AI & Machine Learning Bootcamp(US Only): https://www.simplilearn.com/ai-machine-learning-bootcamp?utm_campaign=MachineLearningscribe&utm_medium=DescriptionFirstFold&utm_source=youtube\n🔥 Purdue Post Graduate Program In AI And Machine Learning: https://www.simplilearn.com/pgp-ai-machine-learning-certification-training-course?utm_campaign=MachineLearningscribe&utm_medium=DescriptionFirstFold&utm_source=youtube\n\nThis Machine Learning basics video will help you understand what Machine Learning is, what are the types of Machine Learning - supervised, unsupervised & reinforcement learning, how Machine Learning works with simple examples, and will also explain how Machine Learning is being used in various industries. Machine learning is a core sub-area of artificial intelligence; it enables computers to get into self-learning mode without being explicitly programmed. When exposed to new data, these computer programs are enabled to learn, grow, change, and develop by themselves. So, the iterative aspect of machine learning is the ability to adapt to new data independently. This is possible as programs learn from previous computations and use “pattern recognition” to produce reliable results.\n\nThe below topics are explained in this Machine Learning basics video:\n1. What is Machine Learning? ( 00:21 )\n2. Types of Machine Learning ( 02:43 )\n2. What is Supervised Learning? ( 02:53 )\n3. What is Unsupervised Learning? ( 03:46 )\n4. What is Reinforcement Learning? ( 04:37 )\n5. Machine Learning applications ( 06:25 )\n\nSubscribe to our channel for more Machine Learning Tutorials: https://www.youtube.com/user/Simplilearn?sub_confirmation=1\n\nDownload the Machine Learning Career Guide to explore and step into the exciting world of Machine Learning and follow the path toward your dream career- https://bit.ly/3eLuTUo\n\nWatch more videos on Machine Learning: https://www.youtube.com/watch?v=7JhjINPwfYQ&list=PLEiEAq2VkUULYYgj13YHUWmRePqiu8Ddy\n\n#MachineLearning #WhatIsMachineLearning #MachineLearningTutorial #MachineLearningBasics #MachineLearningTutorialForBeginners #Simplilearn\n\n➡️ About Caltech Post Graduate Program In AI And Machine Learning\n\nDesigned to boost your career as an AI and ML professional, this program showcases Caltech CTME's excellence and IBM's industry prowess. The artificial intelligence course covers key concepts like Statistics, Data Science with Python, Machine Learning, Deep Learning, NLP, and Reinforcement Learning through an interactive learning model with live sessions.\n\n✅ Key Features\n\n- Simplilearn's JobAssist helps you get noticed by top hiring companies\n- PGP AI & ML completion certificate from Caltech CTME\n- Masterclasses delivered by distinguished Caltech faculty and IBM experts\n- Caltech CTME Circle Membership\n- Earn up to 22 CEUs from Caltech CTME\n- Online convocation by Caltech CTME Program Director\n- IBM certificates for IBM courses\n- Access to hackathons and Ask Me Anything sessions from IBM\n- 25+ hands-on projects from the likes of Twitter, Mercedes Benz, Uber, and many more\n- Seamless access to integrated labs\n- Capstone projects in 3 domains\n- 8X higher interaction in live online classes by industry experts\n\n✅ Skills Covered\n\n- Statistics\n- Python\n- Supervised Learning\n- Unsupervised Learning\n- Recommendation Systems\n- NLP\n- Neural Networks\n- GANs\n- Deep Learning\n- Reinforcement Learning\n- Speech Recognition\n- Ensemble Learning\n- Computer Vision\n\n👉Learn More at: https://www.simplilearn.com/pgp-ai-machine-learning-certification-training-course?utm_campaign=MachineLearningscribe&utm_medium=DescriptionFirstFold&utm_source=youtube\n\n🔥🔥 Interested in Attending Live Classes? Call Us: IN - 18002127688 / US - +18445327688",
                    "duration": "7:52",
                    "helpful_count": 2,
                    "id": 28,
                    "is_bookmarked_fill": False,
                    "like_count": 57523,
                    "not_helpful_count": 0,
                    "publish_time": "2018-09-19T14:57:02Z",
                    "rid": "ukzFI9rgwfU",
                    "similarity_score": 0.9041292667388916,
                    "text": "machine learning | what is machine learning? | introduction to machine learning | 2024 | simplilearn. professional certificate course in ai and machine learning by iit kanpur (india only): ...",
                    "thumbnail": "https://i.ytimg.com/vi/ukzFI9rgwfU/hqdefault.jpg",
                    "title": "Machine Learning | What Is Machine Learning? | Introduction To Machine Learning | 2024 | Simplilearn",
                    "updated_at": "2024-08-05T19:59:04.873620",
                    "uri": "https://www.youtube.com/embed/ukzFI9rgwfU?autoplay=1",
                    "views": 4556240
                },
                {
                    "abstract": None,
                    "saves_count": 0,
                    "channel_title": "NYU-LEARN",
                    "description": "NYU-LEARN's Director, Alyssa Wise, gives the keynote speech, \"What is Learning Analytics\", at the Learning Analytics in STEM ...",
                    "description_full": "NYU-LEARN's Director, Alyssa Wise, gives the keynote speech, \"What is Learning Analytics\", at the Learning Analytics in STEM Education Research (LASER) Institute Summer Workshop hosted by the Friday Institute for Educational Innovation. \n\nLearning Analytics in STEM Education Research (LASER) Institute Summer Workshop: https://www.fi.ncsu.edu/event/laser-institute-summer-workshop/\nFriday Institute for Educational Innovation: https://www.fi.ncsu.edu/",
                    "duration": "21:16",
                    "helpful_count": 0,
                    "id": 33,
                    "is_bookmarked_fill": False,
                    "like_count": 156,
                    "not_helpful_count": 0,
                    "publish_time": "2021-06-22T14:04:39Z",
                    "rid": "KpGtax2RBVY",
                    "similarity_score": 0.9024804830551147,
                    "text": "what is learning analytics?. nyu-learn's director, alyssa wise, gives the keynote speech, \"what is learning analytics\", at the learning analytics in stem ...",
                    "thumbnail": "https://i.ytimg.com/vi/KpGtax2RBVY/hqdefault.jpg",
                    "title": "What is Learning Analytics?",
                    "updated_at": "2024-08-02T17:27:57.367386",
                    "uri": "https://www.youtube.com/embed/KpGtax2RBVY?autoplay=1",
                    "views": 9462
                },
                {
                    "abstract": None,
                    "saves_count": 0,
                    "channel_title": "Fireship",
                    "description": "Machine Learning is the process of teaching a computer how perform a task with out explicitly programming it. The process feeds ...",
                    "description_full": "Machine Learning is the process of teaching a computer how perform a task with out explicitly programming it. The process feeds algorithms with large amounts of data to gradually improve predictive performance. \n\n#ai #python #100SecondsOfCode\n\n🔗 Resources\n\nMachine Learning  Tutorials https://fireship.io/tags/machine-learning/\nWhat is ML https://www.ibm.com/cloud/learn/machine-learning\nNeural Networks https://towardsdatascience.com/a-beginners-guide-to-convolutional-neural-networks-cnns-14649dbddce8\nML Wiki https://en.wikipedia.org/wiki/Machine_learning\n\n🔥 Watch more with Fireship PRO\n\nUpgrade to Fireship PRO at https://fireship.io/pro\nUse code lORhwXd2 for 25% off your first payment. \n\n🎨 My Editor Settings\n\n- Atom One Dark \n- vscode-icons\n- Fira Code Font\n\nTopics Covered\n\n- Convolutional Neural Networks\n- Machine Learning Basics\n- How Data Science Works\n- Big Data and Feature Engineering\n- Artificial Intelligence History\n- Supervised Machine Learning",
                    "duration": "2:35",
                    "helpful_count": 0,
                    "id": 29,
                    "is_bookmarked_fill": False,
                    "like_count": 27892,
                    "not_helpful_count": 0,
                    "publish_time": "2021-09-09T17:31:56Z",
                    "rid": "PeMlggyqz0Y",
                    "similarity_score": 0.8927764296531677,
                    "text": "machine learning explained in 100 seconds. machine learning is the process of teaching a computer how perform a task with out explicitly programming it. the process feeds ...",
                    "thumbnail": "https://i.ytimg.com/vi/PeMlggyqz0Y/hqdefault.jpg",
                    "title": "Machine Learning Explained in 100 Seconds",
                    "updated_at": "2024-08-05T19:59:04.942632",
                    "uri": "https://www.youtube.com/embed/PeMlggyqz0Y?autoplay=1",
                    "views": 592565
                },
                {
                    "abstract": None,
                    "saves_count": 0,
                    "channel_title": "freeCodeCamp.org",
                    "description": "Learn Machine Learning in a way that is accessible to absolute beginners. You will learn the basics of Machine Learning and how ...",
                    "description_full": "Learn Machine Learning in a way that is accessible to absolute beginners. You will learn the basics of Machine Learning and how to use TensorFlow to implement many different concepts.\n\n✏️ Kylie Ying developed this course. Check out her channel: https://www.youtube.com/c/YCubed\n\n⭐️ Code and Resources ⭐️\n🔗 Supervised learning (classification/MAGIC): https://colab.research.google.com/drive/16w3TDn_tAku17mum98EWTmjaLHAJcsk0?usp=sharing\n🔗 Supervised learning (regression/bikes): https://colab.research.google.com/drive/1m3oQ9b0oYOT-DXEy0JCdgWPLGllHMb4V?usp=sharing\n🔗 Unsupervised learning (seeds): https://colab.research.google.com/drive/1zw_6ZnFPCCh6mWDAd_VBMZB4VkC3ys2q?usp=sharing\n🔗 Dataets (add a note that for the bikes dataset, they may have to open the downloaded csv file and remove special characters)\n🔗 MAGIC dataset: https://archive.ics.uci.edu/ml/datasets/MAGIC+Gamma+Telescope\n🔗 Bikes dataset: https://archive.ics.uci.edu/ml/datasets/Seoul+Bike+Sharing+Demand\n🔗 Seeds/wheat dataset: https://archive.ics.uci.edu/ml/datasets/seeds\n\n🏗 Google provided a grant to make this course possible. \n\n⭐️ Contents ⭐️\n⌨️ (0:00:00) Intro\n⌨️ (0:00:58) Data/Colab Intro\n⌨️ (0:08:45) Intro to Machine Learning\n⌨️ (0:12:26) Features\n⌨️ (0:17:23) Classification/Regression\n⌨️ (0:19:57) Training Model\n⌨️ (0:30:57) Preparing Data\n⌨️ (0:44:43) K-Nearest Neighbors\n⌨️ (0:52:42) KNN Implementation\n⌨️ (1:08:43) Naive Bayes\n⌨️ (1:17:30) Naive Bayes Implementation\n⌨️ (1:19:22) Logistic Regression\n⌨️ (1:27:56) Log Regression Implementation\n⌨️ (1:29:13) Support Vector Machine\n⌨️ (1:37:54) SVM Implementation\n⌨️ (1:39:44) Neural Networks\n⌨️ (1:47:57) Tensorflow\n⌨️ (1:49:50) Classification NN using Tensorflow\n⌨️ (2:10:12) Linear Regression\n⌨️ (2:34:54) Lin Regression Implementation\n⌨️ (2:57:44) Lin Regression using a Neuron\n⌨️ (3:00:15) Regression NN using Tensorflow\n⌨️ (3:13:13) K-Means Clustering\n⌨️ (3:23:46) Principal Component Analysis\n⌨️ (3:33:54) K-Means and PCA Implementations\n\n🎉 Thanks to our Champion and Sponsor supporters:\n👾 Raymond Odero\n👾 Agustín Kussrow\n👾 aldo ferretti\n👾 Otis Morgan\n👾 DeezMaster\n\n--\n\nLearn to code for free and get a developer job: https://www.freecodecamp.org\n\nRead hundreds of articles on programming: https://freecodecamp.org/news",
                    "duration": "3:53:53",
                    "helpful_count": 0,
                    "id": 41,
                    "is_bookmarked_fill": False,
                    "like_count": 64176,
                    "not_helpful_count": 0,
                    "publish_time": "2022-09-26T16:00:28Z",
                    "rid": "i_LwzRVP7bg",
                    "similarity_score": 0.8882121443748474,
                    "text": "machine learning for everybody – full course. learn machine learning in a way that is accessible to absolute beginners. you will learn the basics of machine learning and how ...",
                    "thumbnail": "https://i.ytimg.com/vi/i_LwzRVP7bg/hqdefault.jpg",
                    "title": "Machine Learning for Everybody – Full Course",
                    "updated_at": "2024-08-05T19:59:05.059063",
                    "uri": "https://www.youtube.com/embed/i_LwzRVP7bg?autoplay=1",
                    "views": 5678731
                },
                {
                    "abstract": None,
                    "saves_count": 0,
                    "channel_title": "Society for Learning Analytics Research",
                    "description": "A short introduction to learning analytics References: Clow, D. (2012). The learning analytics cycle: closing the loop effectively.",
                    "description_full": "A short introduction to learning analytics\nReferences:\nClow, D. (2012). The learning analytics cycle: closing the loop effectively.\nGašević, D., Dawson, S., & Siemens, G. (2015). Let’s not forget: Learning analytics are about learning. TechTrends, 59(1), 64-71.\nSiemens, G., & d Baker, R. S. (2012, April). Learning analytics and educational data mining: towards communication and collaboration. In Proceedings of the 2nd international conference on learning analytics and knowledge (pp. 252-254). ACM.\nTsai, Y. S., & Gasevic, D. (2017, March). Learning analytics in higher education---challenges and policies: a review of eight learning analytics policies. In Proceedings of the seventh international learning analytics & knowledge conference (pp. 233-242). ACM.\nTsai, Y.-S., Gašević, D., Whitelock-Wainwright, A., Muñoz-Merino, P. J., Moreno-Marcos, P. M., Fernández, A. R., Kloos, C. D., Scheffel, M., Jivet, I., Drachsler, H., Tammets, K., Calleja, A. R., and Kollom, K. (2018) SHEILA: Supporting Higher Education to Intergrade Learning Analytics Research Report (https://sheilaproject.eu/2018/11/30/sheila-final-research-report/)",
                    "duration": "2:55",
                    "helpful_count": 0,
                    "id": 35,
                    "is_bookmarked_fill": False,
                    "like_count": 191,
                    "not_helpful_count": 0,
                    "publish_time": "2019-08-28T03:05:46Z",
                    "rid": "XscUZ8dIa-8",
                    "similarity_score": 0.8899713754653931,
                    "text": "learning analytics in a nutshell. a short introduction to learning analytics references: clow, d. (2012). the learning analytics cycle: closing the loop effectively.",
                    "thumbnail": "https://i.ytimg.com/vi/XscUZ8dIa-8/hqdefault.jpg",
                    "title": "Learning analytics in a nutshell",
                    "updated_at": "2024-08-02T17:27:57.466813",
                    "uri": "https://www.youtube.com/embed/XscUZ8dIa-8?autoplay=1",
                    "views": 19749
                },
                {
                    "abstract": None,
                    "saves_count": 0,
                    "channel_title": "BioTech Whisperer",
                    "description": "Dr BioTech Whisperer introduces an overview of Learning Analytics. Learn about them in 4 minutes within this video. Thank you ...",
                    "description_full": "Dr BioTech Whisperer introduces an overview of Learning Analytics. Learn about them in 4 minutes within this video. Thank you for your support. \n\n☕ BUY ME A COFFEE \nSupport us with a morning coffeebreak\nhttps://www.buymeacoffee.com/biotechW\n\n#analytics #effectivelearning #student #learning #lifesciencestudent #learning #educator",
                    "duration": "3:48",
                    "helpful_count": 0,
                    "id": 31,
                    "is_bookmarked_fill": False,
                    "like_count": 42,
                    "not_helpful_count": 0,
                    "publish_time": "2023-01-27T07:49:03Z",
                    "rid": "ypplDa2B-QA",
                    "similarity_score": 0.8834349513053894,
                    "text": "learning analytics explained in 4 minutes. dr biotech whisperer introduces an overview of learning analytics. learn about them in 4 minutes within this video. thank you ...",
                    "thumbnail": "https://i.ytimg.com/vi/ypplDa2B-QA/hqdefault.jpg",
                    "title": "Learning Analytics Explained in 4 Minutes",
                    "updated_at": "2024-08-02T17:27:57.284336",
                    "uri": "https://www.youtube.com/embed/ypplDa2B-QA?autoplay=1",
                    "views": 3396
                },
                {
                    "abstract": None,
                    "saves_count": 0,
                    "channel_title": "Cambridge University Press ELT",
                    "description": "Join our speaker Dr. Hayo Reinders, at his talk from the Better Learning Conference in July. The talk focuses on learning analytics ...",
                    "description_full": "Join our speaker Dr. Hayo Reinders, at his talk from the Better Learning Conference in July. The talk focuses on learning analytics and how to use it in your language teaching. \n\nMore videos from the conference will be released soon, be the first to be notified of new releases and subscribe to our channel.  http://bit.ly/CUPELTYouTube\n\nMore information on this topic can be found on our blog: http://bit.ly/BetterLearningConference2019",
                    "duration": "30:40",
                    "helpful_count": 0,
                    "id": 34,
                    "is_bookmarked_fill": True,
                    "like_count": 101,
                    "not_helpful_count": 1,
                    "publish_time": "2019-09-20T11:45:57Z",
                    "rid": "i6rO8cdMISM",
                    "similarity_score": 0.8786557912826538,
                    "text": "dr hayo reinders - learning analytics for language teaching. join our speaker dr. hayo reinders, at his talk from the better learning conference in july. the talk focuses on learning analytics ...",
                    "thumbnail": "https://i.ytimg.com/vi/i6rO8cdMISM/hqdefault.jpg",
                    "title": "Dr Hayo Reinders - Learning Analytics for Language Teaching",
                    "updated_at": "2024-08-02T17:27:57.447027",
                    "uri": "https://www.youtube.com/embed/i6rO8cdMISM?autoplay=1",
                    "views": 2888
                },
                {
                    "abstract": None,
                    "saves_count": 0,
                    "channel_title": "Programming with Mosh",
                    "description": "Go from zero to a machine learning engineer in 12 months. This step-by-step roadmap covers the essential skills you must learn ...",
                    "description_full": "Go from zero to a machine learning engineer in 12 months. This step-by-step roadmap covers the essential skills you must learn to become a machine learning engineer in 2024. \n\nDownload the FREE roadmap PDF here: https://mosh.link/machine-learning-roadmap\n\n✋ Stay connected\n\n- Complete courses: https://codewithmosh.com\n- Twitter: https://twitter.com/moshhamedani\n- Facebook: https://www.facebook.com/programmingwithmosh/\n- Instagram: https://www.instagram.com/codewithmosh.official/\n- LinkedIn: https://www.linkedin.com/school/codewithmosh/\n\n🔗 Other roadmaps\n\nhttps://youtu.be/Tef1e9FiSR0?si=QpVnZ_o9-DAXzT71\nhttps://youtu.be/OeEHJgzqS1k?si=qd0ZIqAzUpZQn6BX\n\n📚 Tutorials \n\nhttps://youtu.be/_uQrJ0TkZlc?si=ZhlCrQs1SkaPNVa8\nhttps://youtu.be/8JJ101D3knE?si=OGTuS35LQqSunuhh\nhttps://youtu.be/BBpAmxU_NQo?si=dm-ZCPxVBYWS1Qhn\nhttps://youtu.be/7S_tz1z_5bA?si=QL7s_M2Ao90RDwG8\n\n📖 Chapters\n\n00:00 - Introduction\n00:20 - Programming Languages\n00:42 - Version Control\n01:03 - Data Structures & Algorithms \n01:35 - SQL\n01:55 - The Complete Roadmap PDF\n02:19 - Mathematics & Statistics\n02:40 - Data Handling \n03:15 - Machine Learning Fundamentals\n03:57 - Advanced Topics \n04:28 - Model Deployment\n\n#machinelearning #ai #datascience #coding #programming",
                    "duration": "5:25",
                    "helpful_count": 0,
                    "id": 40,
                    "is_bookmarked_fill": False,
                    "like_count": 4028,
                    "not_helpful_count": 0,
                    "publish_time": "2024-07-18T13:00:06Z",
                    "rid": "7IgVGSaQPaw",
                    "similarity_score": 0.8705939650535583,
                    "text": "the complete machine learning roadmap [2024]. go from zero to a machine learning engineer in 12 months. this step-by-step roadmap covers the essential skills you must learn ...",
                    "thumbnail": "https://i.ytimg.com/vi/7IgVGSaQPaw/hqdefault.jpg",
                    "title": "The Complete Machine Learning Roadmap [2024]",
                    "updated_at": "2024-08-05T19:59:05.009015",
                    "uri": "https://www.youtube.com/embed/7IgVGSaQPaw?autoplay=1",
                    "views": 82838
                },
                {
                    "abstract": None,
                    "saves_count": 0,
                    "channel_title": "Data Analytics and Learning MOOC",
                    "description": "Basic Introduction to Learning Analytics by George Siemens.",
                    "description_full": "Basic Introduction to Learning Analytics by George Siemens",
                    "duration": "7:9",
                    "helpful_count": 12,
                    "id": 32,
                    "is_bookmarked_fill": False,
                    "like_count": 160,
                    "not_helpful_count": 0,
                    "publish_time": "2014-10-13T21:44:49Z",
                    "rid": "idHxNSTZhNM",
                    "similarity_score": 0.8632986545562744,
                    "text": "week 1: introduction to learning analytics. basic introduction to learning analytics by george siemens.",
                    "thumbnail": "https://i.ytimg.com/vi/idHxNSTZhNM/hqdefault.jpg",
                    "title": "Week 1: Introduction to Learning Analytics",
                    "updated_at": "2024-08-02T17:27:57.355563",
                    "uri": "https://www.youtube.com/embed/idHxNSTZhNM?autoplay=1",
                    "views": 28559
                }
            ]
        
            }

        },
        "recommendation_type": "1"
    }
    return data